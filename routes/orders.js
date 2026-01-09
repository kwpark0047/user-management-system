const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Store = require('../models/Store');
const Table = require('../models/Table');
const OrderLog = require('../models/OrderLog');
const TableAssignment = require('../models/TableAssignment');
const authMiddleware = require('../middleware/auth');
const { checkStorePermission, getStoreRole } = require('../middleware/storeAuth');
const { sendOrderReadyNotification, sendNewOrderNotification, sendOrderStatusNotification } = require('../utils/notifications');

// 매장별 주문 조회 (order:read 권한)
router.get('/store/:storeId', authMiddleware, checkStorePermission('order:read'), (req, res) => {
  try {
    const { status, date } = req.query;
    const orders = Order.findByStoreId(req.storeId, status, date);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 상세 매출 통계 (stats:read 권한)
router.get('/store/:storeId/stats/detailed', authMiddleware, checkStorePermission('stats:read'), (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const db = require('../config/database');
    const storeId = req.storeId;
    let dateFilter = '';
    const params = [storeId];
    if (start_date && end_date) {
      dateFilter = "AND date(created_at) BETWEEN ? AND ?";
      params.push(start_date, end_date);
    } else {
      dateFilter = "AND date(created_at) = date('now')";
    }
    const dailySales = db.prepare(`SELECT date(created_at) as date, COUNT(*) as order_count, COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as sales FROM orders WHERE store_id = ? ${dateFilter} GROUP BY date(created_at) ORDER BY date(created_at)`).all(...params);
    const hourlySales = db.prepare(`SELECT strftime('%H', created_at) as hour, COUNT(*) as order_count, COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as sales FROM orders WHERE store_id = ? ${dateFilter} GROUP BY strftime('%H', created_at) ORDER BY hour`).all(...params);
    const topProducts = db.prepare(`SELECT oi.product_name, oi.product_id, SUM(oi.quantity) as total_quantity, SUM(oi.subtotal) as total_sales FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.store_id = ? ${dateFilter.replace('created_at', 'o.created_at')} GROUP BY oi.product_id, oi.product_name ORDER BY total_quantity DESC LIMIT 10`).all(...params);
    const paymentStats = db.prepare(`SELECT COALESCE(payment_method, 'unknown') as method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM orders WHERE store_id = ? AND payment_status = 'paid' ${dateFilter} GROUP BY payment_method`).all(...params);
    const summary = db.prepare(`SELECT COUNT(*) as total_orders, COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_sales, COALESCE(AVG(CASE WHEN payment_status = 'paid' THEN total_amount ELSE NULL END), 0) as avg_order_amount, COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders, COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders FROM orders WHERE store_id = ? ${dateFilter}`).get(...params);
    res.json({ summary, daily_sales: dailySales, hourly_sales: hourlySales, top_products: topProducts, payment_stats: paymentStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 매장 매출 통계 (stats:read 권한)
router.get('/store/:storeId/stats', authMiddleware, checkStorePermission('stats:read'), (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const stats = Order.getStats(req.storeId, start_date, end_date);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 특정 주문 조회 (공개)
router.get('/:id', (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 주문 생성 (공개 - 고객용)
router.post('/', (req, res) => {
  try {
    const { store_id, table_id, items } = req.body;
    if (!store_id) return res.status(400).json({ error: '매장 ID는 필수입니다' });
    if (!items || items.length === 0) return res.status(400).json({ error: '주문 항목이 필요합니다' });
    const store = Store.findById(store_id);
    if (!store || !store.is_active) return res.status(400).json({ error: '현재 주문할 수 없는 매장입니다' });
    if (table_id) {
      const table = Table.findById(table_id);
      if (!table || table.store_id !== parseInt(store_id)) return res.status(400).json({ error: '유효하지 않은 테이블입니다' });
    }
    const order = Order.create(req.body);

    // 새 주문 알림 발송
    const io = req.app.get('io');
    if (io) {
      sendNewOrderNotification(io, order);
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 주문 상태 변경 (order:write 권한, kitchen 제외)
router.put('/:id/status', authMiddleware, (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    const role = getStoreRole(req.user.id, order.store_id);
    if (!role) return res.status(403).json({ error: '권한이 없습니다' });
    if (role === 'kitchen') return res.status(403).json({ error: '주방 역할은 주문 상태를 변경할 수 없습니다' });
    const { status } = req.body;
    if (!['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ error: '유효하지 않은 상태입니다' });
    const oldStatus = order.status;
    const updated = Order.updateStatus(req.params.id, status, req.user.id);
    // 상태 변경 로그 저장
    OrderLog.create(updated.id, req.user.id, oldStatus, status);

    // 알림 발송
    const io = req.app.get('io');
    if (io) {
      // 모든 상태 변경에 대해 고객에게 알림
      sendOrderStatusNotification(io, updated, oldStatus, status);

      // 준비완료 상태일 때 특별 알림
      if (status === 'ready') {
        const assignment = order.table_id ? TableAssignment.getByTable(order.store_id, order.table_id) : null;
        sendOrderReadyNotification(io, updated, assignment);
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 결제 정보 업데이트 (order:write 권한)
router.put('/:id/payment', authMiddleware, (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    const role = getStoreRole(req.user.id, order.store_id);
    if (!role || role === 'kitchen') return res.status(403).json({ error: '권한이 없습니다' });
    const { payment_method, payment_status } = req.body;
    const updated = Order.updatePayment(req.params.id, payment_method, payment_status);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 대기순번 업데이트 (order:write 권한)
router.put('/:id/queue', authMiddleware, (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    const role = getStoreRole(req.user.id, order.store_id);
    if (!role || role === 'kitchen') return res.status(403).json({ error: '권한이 없습니다' });
    const { queue_number, estimated_minutes } = req.body;
    const updated = Order.updateQueue(req.params.id, queue_number, estimated_minutes);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 다음 대기순번 조회 (order:read 권한)
router.get('/store/:storeId/next-queue', authMiddleware, checkStorePermission('order:read'), (req, res) => {
  try {
    const nextQueue = Order.getNextQueueNumber(req.storeId);
    res.json({ next_queue_number: nextQueue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 주문 삭제 (owner/admin만)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    const role = getStoreRole(req.user.id, order.store_id);
    if (!role || !['owner', 'admin'].includes(role)) return res.status(403).json({ error: '권한이 없습니다' });
    Order.delete(req.params.id);
    res.json({ message: '삭제되었습니다' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
