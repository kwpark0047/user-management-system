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
