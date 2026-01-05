const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// 모든 사용자 조회 (공개)
router.get('/', (req, res) => {
  try {
    const users = User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 특정 사용자 조회 (공개)
router.get('/:id', (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 사용자 수정 (인증 필요)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    const { name, email } = req.body;
    const updated = User.update(req.params.id, name, email);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 사용자 삭제 (인증 필요)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const user = User.delete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    res.json({ message: '삭제되었습니다', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
