const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { checkStorePermission } = require('../middleware/storeAuth');
const OrderLog = require('../models/OrderLog');

// 기간별 매출 분석
router.get('/:storeId/sales', authMiddleware, checkStorePermission('analytics:read'), (req, res) => {
  try {
    const { storeId } = req.params;
    const { period = 'daily', start, end } = req.query;

    const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const endDate = end || new Date().toISOString().slice(0, 10);

    let groupBy, labelFormat;
    switch (period) {
      case 'weekly':
        groupBy = "strftime('%Y-W%W', created_at)";
        labelFormat = 'week';
        break;
      case 'monthly':
        groupBy = "strftime('%Y-%m', created_at)";
        labelFormat = 'month';
        break;
      default: // daily
        groupBy = "date(created_at)";
        labelFormat = 'date';
    }

    // 기간별 매출 데이터
    const salesData = db.prepare(`
      SELECT
        ${groupBy} as label,
        COUNT(*) as orders,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as sales
      FROM orders
      WHERE store_id = ? AND date(created_at) BETWEEN ? AND ?
      GROUP BY ${groupBy}
      ORDER BY label
    `).all(storeId, startDate, endDate);

    // 요약 통계
    const summary = db.prepare(`
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_sales,
        AVG(CASE WHEN payment_status = 'paid' THEN total_amount ELSE NULL END) as avg_order_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM orders
      WHERE store_id = ? AND date(created_at) BETWEEN ? AND ?
    `).get(storeId, startDate, endDate);

    // 최고 매출일
    const bestDay = db.prepare(`
      SELECT
        date(created_at) as date,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as sales
      FROM orders
      WHERE store_id = ? AND date(created_at) BETWEEN ? AND ?
      GROUP BY date(created_at)
      ORDER BY sales DESC
      LIMIT 1
    `).get(storeId, startDate, endDate);

    res.json({
      period,
      data: salesData,
      summary: {
        ...summary,
        avg_order_amount: Math.round(summary.avg_order_amount || 0),
        best_day: bestDay
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 전기간 대비 비교
router.get('/:storeId/comparison', authMiddleware, checkStorePermission('analytics:read'), (req, res) => {
  try {
    const { storeId } = req.params;
    const { period = 'weekly' } = req.query;

    const today = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;

    switch (period) {
      case 'monthly':
        // 이번달 vs 저번달
        currentStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
        currentEnd = today.toISOString().slice(0, 10);
        previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 10);
        previousEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().slice(0, 10);
        break;
      default: // weekly
        // 이번주 vs 저번주
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const currentMonday = new Date(today);
        currentMonday.setDate(today.getDate() + mondayOffset);
        currentStart = currentMonday.toISOString().slice(0, 10);
        currentEnd = today.toISOString().slice(0, 10);
        const previousMonday = new Date(currentMonday);
        previousMonday.setDate(currentMonday.getDate() - 7);
        const previousSunday = new Date(currentMonday);
        previousSunday.setDate(currentMonday.getDate() - 1);
        previousStart = previousMonday.toISOString().slice(0, 10);
        previousEnd = previousSunday.toISOString().slice(0, 10);
    }

    const getStats = (start, end) => {
      return db.prepare(`
        SELECT
          COUNT(*) as orders,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as sales
        FROM orders
        WHERE store_id = ? AND date(created_at) BETWEEN ? AND ?
      `).get(storeId, start, end);
    };

    const current = getStats(currentStart, currentEnd);
    const previous = getStats(previousStart, previousEnd);

    const calcGrowth = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

    res.json({
      period,
      current: {
        start: currentStart,
        end: currentEnd,
        ...current
      },
      previous: {
        start: previousStart,
        end: previousEnd,
        ...previous
      },
      growth: {
        orders: calcGrowth(current.orders, previous.orders),
        sales: calcGrowth(current.sales, previous.sales)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 인기 메뉴 분석
router.get('/:storeId/products', authMiddleware, checkStorePermission('analytics:read'), (req, res) => {
  try {
    const { storeId } = req.params;
    const { start, end, limit = 10, sort = 'quantity' } = req.query;

    const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const endDate = end || new Date().toISOString().slice(0, 10);

    const orderBy = sort === 'sales' ? 'total_sales DESC' : 'total_quantity DESC';

    const products = db.prepare(`
      SELECT
        oi.product_id,
        oi.product_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.subtotal) as total_sales,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.store_id = ? AND date(o.created_at) BETWEEN ? AND ?
      GROUP BY oi.product_id, oi.product_name
      ORDER BY ${orderBy}
      LIMIT ?
    `).all(storeId, startDate, endDate, parseInt(limit));

    // 전체 판매량/매출 계산
    const totals = db.prepare(`
      SELECT
        SUM(oi.quantity) as total_quantity,
        SUM(oi.subtotal) as total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.store_id = ? AND date(o.created_at) BETWEEN ? AND ?
    `).get(storeId, startDate, endDate);

    // 각 상품의 점유율 계산
    const productsWithShare = products.map((p, idx) => ({
      rank: idx + 1,
      ...p,
      quantity_share: totals.total_quantity ? Math.round((p.total_quantity / totals.total_quantity) * 1000) / 10 : 0,
      sales_share: totals.total_sales ? Math.round((p.total_sales / totals.total_sales) * 1000) / 10 : 0
    }));

    res.json({
      products: productsWithShare,
      totals: {
        quantity: totals.total_quantity || 0,
        sales: totals.total_sales || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 직원 성과 분석
router.get('/:storeId/staff', authMiddleware, checkStorePermission('analytics:read'), (req, res) => {
  try {
    const { storeId } = req.params;
    const { start, end } = req.query;

    const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const endDate = end || new Date().toISOString().slice(0, 10);

    // 직원별 주문 처리 통계
    const staffStats = OrderLog.getStaffStats(storeId, startDate, endDate);

    // 역할 한글명 추가
    const ROLE_LABELS = {
      owner: '대표',
      admin: '관리자',
      manager: '매니저',
      staff: '직원',
      kitchen: '주방'
    };

    const staffWithLabels = staffStats.map((s, idx) => ({
      rank: idx + 1,
      ...s,
      role_label: ROLE_LABELS[s.role] || s.role
    }));

    res.json({
      period: { start: startDate, end: endDate },
      staff: staffWithLabels
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 시간대별 매출 분석
router.get('/:storeId/hourly', authMiddleware, checkStorePermission('analytics:read'), (req, res) => {
  try {
    const { storeId } = req.params;
    const { start, end } = req.query;

    const startDate = start || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const endDate = end || new Date().toISOString().slice(0, 10);

    const hourlyData = db.prepare(`
      SELECT
        CAST(strftime('%H', created_at) AS INTEGER) as hour,
        COUNT(*) as orders,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as sales
      FROM orders
      WHERE store_id = ? AND date(created_at) BETWEEN ? AND ?
      GROUP BY strftime('%H', created_at)
      ORDER BY hour
    `).all(storeId, startDate, endDate);

    // 24시간 전체 데이터 생성 (없는 시간대는 0으로)
    const fullHourlyData = [];
    for (let h = 0; h < 24; h++) {
      const found = hourlyData.find(d => d.hour === h);
      fullHourlyData.push({
        hour: h,
        label: String(h).padStart(2, '0') + ':00',
        orders: found ? found.orders : 0,
        sales: found ? found.sales : 0
      });
    }

    // 피크 시간대
    const peakHour = fullHourlyData.reduce((max, curr) =>
      curr.sales > max.sales ? curr : max, fullHourlyData[0]);

    res.json({
      data: fullHourlyData,
      peak: peakHour
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
