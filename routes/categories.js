const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Store = require('../models/Store');
const authMiddleware = require('../middleware/auth');
const { getStoreRole } = require('../middleware/storeAuth');

// 매장별 카테고리 조회 (공개)
router.get('/store/:storeId', (req, res) => {
  try {
    const categories = Category.findByStoreId(req.params.storeId);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 카테고리 생성 (category:write 권한)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { store_id, name } = req.body;
    if (!store_id || !name) return res.status(400).json({ error: '매장 ID와 카테고리명은 필수입니다' });
    const role = getStoreRole(req.user.id, store_id);
    if (!role || !['owner', 'admin', 'manager'].includes(role)) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }
    const category = Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 카테고리 수정 (category:write 권한)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const category = Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: '카테고리를 찾을 수 없습니다' });
    const role = getStoreRole(req.user.id, category.store_id);
    if (!role || !['owner', 'admin', 'manager'].includes(role)) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }
    const updated = Category.update(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 카테고리 삭제 (category:write 권한)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const category = Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: '카테고리를 찾을 수 없습니다' });
    const role = getStoreRole(req.user.id, category.store_id);
    if (!role || !['owner', 'admin', 'manager'].includes(role)) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }
    Category.delete(req.params.id);
    res.json({ message: '삭제되었습니다' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
