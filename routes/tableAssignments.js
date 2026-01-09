const express = require('express');
const router = express.Router();
const TableAssignment = require('../models/TableAssignment');
const authMiddleware = require('../middleware/auth');
const { getStoreRole } = require('../middleware/storeAuth');

// 매장 전체 테이블 담당자 목록 조회
router.get('/stores/:storeId/table-assignments', authMiddleware, (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    const role = getStoreRole(req.user.id, storeId);
    if (!role) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const assignments = TableAssignment.getAllByStore(storeId);
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 테이블 담당자 지정/변경
router.put('/stores/:storeId/table-assignments/:tableId', authMiddleware, (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    const tableId = parseInt(req.params.tableId);
    const { staff_user_id } = req.body;

    if (!staff_user_id) {
      return res.status(400).json({ error: '담당 직원 ID는 필수입니다' });
    }

    const role = getStoreRole(req.user.id, storeId);
    if (!role || !['owner', 'admin', 'manager'].includes(role)) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const assignment = TableAssignment.assign(storeId, tableId, staff_user_id);
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 테이블 담당자 해제
router.delete('/stores/:storeId/table-assignments/:tableId', authMiddleware, (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    const tableId = parseInt(req.params.tableId);

    const role = getStoreRole(req.user.id, storeId);
    if (!role || !['owner', 'admin', 'manager'].includes(role)) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const removed = TableAssignment.removeAssignment(storeId, tableId);
    if (!removed) {
      return res.status(404).json({ error: '담당자 지정이 없습니다' });
    }

    res.json({ message: '담당자가 해제되었습니다' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 내 담당 테이블 목록 조회
router.get('/stores/:storeId/my-tables', authMiddleware, (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    const role = getStoreRole(req.user.id, storeId);
    if (!role) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }

    const tables = TableAssignment.getByStaff(storeId, req.user.id);
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
