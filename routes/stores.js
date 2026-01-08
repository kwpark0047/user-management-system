const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const StoreStaff = require('../models/StoreStaff');
const authMiddleware = require('../middleware/auth');
const { getStoreRole } = require('../middleware/storeAuth');

// 모든 매장 조회 (공개)
router.get('/', (req, res) => {
  try {
    const stores = Store.findAll();
    res.json(stores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 내 매장 조회 (인증 필요 - 소유 + 직원으로 등록된 매장)
router.get('/my', authMiddleware, (req, res) => {
  try {
    const ownedStores = Store.findByOwnerId(req.user.id).map(s => ({
      ...s,
      role: 'owner',
      role_label: '대표'
    }));
    const staffStores = StoreStaff.findStoresByUserId(req.user.id).map(s => ({
      ...s,
      role_label: { admin: '관리자', manager: '매니저', staff: '직원', kitchen: '주방' }[s.role]
    }));
    const storeMap = new Map();
    ownedStores.forEach(s => storeMap.set(s.id, s));
    staffStores.forEach(s => {
      if (!storeMap.has(s.id)) storeMap.set(s.id, s);
    });
    res.json(Array.from(storeMap.values()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 특정 매장 조회 (공개)
router.get('/:id', (req, res) => {
  try {
    const store = Store.findById(req.params.id);
    if (!store) return res.status(404).json({ error: '매장을 찾을 수 없습니다' });
    res.json(store);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 매장 생성 (인증 필요)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: '매장명은 필수입니다' });
    const store = Store.create({ ...req.body, owner_id: req.user.id });
    res.status(201).json(store);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 매장 수정 (store:settings 권한 - owner/admin)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const store = Store.findById(req.params.id);
    if (!store) return res.status(404).json({ error: '매장을 찾을 수 없습니다' });
    const role = getStoreRole(req.user.id, store.id);
    if (!role || !['owner', 'admin'].includes(role)) return res.status(403).json({ error: '권한이 없습니다' });
    const updated = Store.update(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 매장 삭제 (store:delete 권한 - owner만)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const store = Store.findById(req.params.id);
    if (!store) return res.status(404).json({ error: '매장을 찾을 수 없습니다' });
    if (store.owner_id !== req.user.id) return res.status(403).json({ error: '매장 삭제는 대표만 가능합니다' });
    Store.delete(req.params.id);
    res.json({ message: '삭제되었습니다' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
