const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Store = require('../models/Store');
const authMiddleware = require('../middleware/auth');

// 매장별 상품 조회 (공개)
router.get('/store/:storeId', (req, res) => {
  try {
    const { category_id } = req.query;
    const products = Product.findByStoreId(req.params.storeId, category_id);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 특정 상품 조회 (공개)
router.get('/:id', (req, res) => {
  try {
    const product = Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 상품 생성 (인증 필요)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { store_id, name, price } = req.body;
    if (!store_id || !name) {
      return res.status(400).json({ error: '매장 ID와 상품명은 필수입니다' });
    }

    const store = Store.findById(store_id);
    if (!store || store.owner_id !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const product = Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 상품 수정 (인증 필요)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const product = Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다' });
    }

    const store = Store.findById(product.store_id);
    if (!store || store.owner_id !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const updated = Product.update(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 상품 삭제 (인증 필요)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const product = Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다' });
    }

    const store = Store.findById(product.store_id);
    if (!store || store.owner_id !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    Product.delete(req.params.id);
    res.json({ message: '삭제되었습니다' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
