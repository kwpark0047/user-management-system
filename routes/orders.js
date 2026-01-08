const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Store = require('../models/Store');
const Table = require('../models/Table');
const authMiddleware = require('../middleware/auth');

// 매장별 주문 조회 (인증 필요)
router.get('/store/:storeId', authMiddleware, (req, res) => {
  try {
    const store = Store.findById(req.params.storeId);
    if (!store || store.owner_id !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const { status, date } = req.query;
    const orders = Order.findByStoreId(req.params.storeId, status, date);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 상세 매출 통계 (인증 필요)
router.get('/store/:storeId/stats/detailed', authMiddleware, (req, res) => {
  try {
    const store = Store.findById(req.params.storeId);
    if (!store || store.owner_id !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const { start_date, end_date } = req.query;
    const db = require('../config/database');
    const storeId = req.params.storeId;

    let dateFilter = '';
    const params = [storeId];

    if (start_date && end_date) {
      dateFilter = "AND date(created_at) BETWEEN ? AND ?";
      params.push(start_date, end_date);
    } else {
      dateFilter = "AND date(created_at) = date('now')";
    }

    // 일별 매출
    const dailySales = db.prepare(`
      SELECT date(created_at) as date,
             COUNT(*) as order_count,
             COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as sales
      FROM orders
      WHERE store_id = ? ${dateFilter}
      GROUP BY date(created_at)
      ORDER BY date(created_at)
    `).all(...params);

    // 시간대별 매출
    const hourlySales = db.prepare(`
      SELECT strftime('%H', created_at) as hour,
             COUNT(*) as order_count,
             COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as sales
      FROM orders
      WHERE store_id = ? ${dateFilter}
      GROUP BY strftime('%H', created_at)
      ORDER BY hour
    `).all(...params);

    // 인기 메뉴 (Top 10)
    const topProducts = db.prepare(`
      SELECT oi.product_name, oi.product_id,
             SUM(oi.quantity) as total_quantity,
             SUM(oi.subtotal) as total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.store_id = ? ${dateFilter.replace('created_at', 'o.created_at')}
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_quantity DESC
      LIMIT 10
    `).all(...params);

    // 결제 방법별 통계
    const paymentStats = db.prepare(`
      SELECT COALESCE(payment_method, 'unknown') as method,
             COUNT(*) as count,
             COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE store_id = ? AND payment_status = 'paid' ${dateFilter}
      GROUP BY payment_method
    `).all(...params);

    // 전체 요약
    const summary = db.prepare(`
      SELECT COUNT(*) as total_orders,
             COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_sales,
             COALESCE(AVG(CASE WHEN payment_status = 'paid' THEN total_amount ELSE NULL END), 0) as avg_order_amount,
             COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
             COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM orders
      WHERE store_id = ? ${dateFilter}
    `).get(...params);

    res.json({
      summary,
      daily_sales: dailySales,
      hourly_sales: hourlySales,
      top_products: topProducts,
      payment_stats: paymentStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 매장 매출 통계 (인증 필요)
router.get('/store/:storeId/stats', authMiddleware, (req, res) => {
  try {
    const store = Store.findById(req.params.storeId);
    if (!store || store.owner_id !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const { start_date, end_date } = req.query;
    const stats = Order.getStats(req.params.storeId, start_date, end_date);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 특정 주문 조회 (공개 - 주문번호로 조회)
router.get('/:id', (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 주문 생성 (공개 - 고객용)
router.post('/', (req, res) => {
  try {
    const { store_id, table_id, items } = req.body;

    if (!store_id) {
      return res.status(400).json({ error: '매장 ID는 필수입니다' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: '주문 항목이 필요합니다' });
    }

    const store = Store.findById(store_id);
    if (!store || !store.is_active) {
      return res.status(400).json({ error: '현재 주문할 수 없는 매장입니다' });
    }

    if (table_id) {
      const table = Table.findById(table_id);
      if (!table || table.store_id !== parseInt(store_id)) {
        return res.status(400).json({ error: '유효하지 않은 테이블입니다' });
      }
    }

    const order = Order.create(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 주문 상태 변경 (인증 필요)
router.put('/:id/status', authMiddleware, (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    }

    const store = Store.findById(order.store_id);
    if (!store || store.owner_id !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const { status } = req.body;
    if (!['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: '유효하지 않은 상태입니다' });
    }

    const updated = Order.updateStatus(req.params.id, status);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 결제 정보 업데이트 (인증 필요)
router.put('/:id/payment', authMiddleware, (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    }

    const store = Store.findById(order.store_id);
    if (!store || store.owner_id !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const { payment_method, payment_status } = req.body;
    const updated = Order.updatePayment(req.params.id, payment_method, payment_status);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 대기순번 및 예정시간 업데이트 (인증 필요)
router.put('/:id/queue', authMiddleware, (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    }

    const store = Store.findById(order.store_id);
    if (!store || store.owner_id !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const { queue_number, estimated_minutes } = req.body;
    const updated = Order.updateQueue(req.params.id, queue_number, estimated_minutes);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 다음 대기순번 조회 (인증 필요)
router.get('/store/:storeId/next-queue', authMiddleware, (req, res) => {
  try {
    const store = Store.findById(req.params.storeId);
    if (!store || store.owner_id !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const nextQueue = Order.getNextQueueNumber(req.params.storeId);
    res.json({ next_queue_number: nextQueue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 주문 삭제 (인증 필요)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    }

    const store = Store.findById(order.store_id);
    if (!store || store.owner_id !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    Order.delete(req.params.id);
    res.json({ message: '삭제되었습니다' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
