const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const Store = require('../models/Store');
const authMiddleware = require('../middleware/auth');

// 매장별 테이블 조회 (공개)
router.get('/store/:storeId', (req, res) => {
  try {
    const tables = Table.findByStoreId(req.params.storeId);
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// QR 코드로 테이블 조회 (공개 - 고객용)
router.get('/qr/:qrCode', (req, res) => {
  try {
    const table = Table.findByQrCode(req.params.qrCode);
    if (!table) {
      return res.status(404).json({ error: '테이블을 찾을 수 없습니다' });
    }
    if (!table.store_active || !table.is_active) {
      return res.status(400).json({ error: '현재 이용할 수 없는 테이블입니다' });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 테이블 생성 (인증 필요)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { store_id, name } = req.body;
    if (!store_id || !name) {
      return res.status(400).json({ error: '매장 ID와 테이블명은 필수입니다' });
    }

    const store = Store.findById(store_id);
    if (!store || store.owner_id !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const table = Table.create(req.body);
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 테이블 수정 (인증 필요)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const table = Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ error: '테이블을 찾을 수 없습니다' });
    }

    const store = Store.findById(table.store_id);
    if (!store || store.owner_id !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const updated = Table.update(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// QR 코드 재생성 (인증 필요)
router.post('/:id/regenerate-qr', authMiddleware, (req, res) => {
  try {
    const table = Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ error: '테이블을 찾을 수 없습니다' });
    }

    const store = Store.findById(table.store_id);
    if (!store || store.owner_id !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const updated = Table.regenerateQrCode(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 테이블 삭제 (인증 필요)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const table = Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ error: '테이블을 찾을 수 없습니다' });
    }

    const store = Store.findById(table.store_id);
    if (!store || store.owner_id !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    Table.delete(req.params.id);
    res.json({ message: '삭제되었습니다' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
