const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const authMiddleware = require('../middleware/auth');

// 통계 조회 (공개)
router.get('/stats', (req, res) => {
  try {
    const stats = Customer.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 모든 고객 조회 (공개)
router.get('/', (req, res) => {
  try {
    const { search } = req.query;
    const customers = Customer.findAll(search);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 특정 고객 조회 (공개)
router.get('/:id', (req, res) => {
  try {
    const customer = Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: '고객을 찾을 수 없습니다' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 고객 생성 (인증 필요)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: '이름은 필수입니다' });
    }
    const customer = Customer.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 고객 수정 (인증 필요)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const customer = Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: '고객을 찾을 수 없습니다' });
    }
    const updated = Customer.update(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 고객 삭제 (인증 필요)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const customer = Customer.delete(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: '고객을 찾을 수 없습니다' });
    }
    res.json({ message: '삭제되었습니다', customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
