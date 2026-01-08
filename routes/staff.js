const express = require('express');
const router = express.Router();
const StoreStaff = require('../models/StoreStaff');
const User = require('../models/User');
const Store = require('../models/Store');
const authMiddleware = require('../middleware/auth');
const { checkStorePermission, getStoreRole, ROLE_LABELS } = require('../middleware/storeAuth');

// 매장 직원 목록 조회
router.get('/store/:storeId',
  authMiddleware,
  checkStorePermission('staff:manage'),
  (req, res) => {
    try {
      const staff = StoreStaff.findByStoreId(req.params.storeId);

      // 역할 한글명 추가
      const staffWithLabels = staff.map(s => ({
        ...s,
        role_label: ROLE_LABELS[s.role]
      }));

      res.json(staffWithLabels);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// 직원 계정 생성 및 매장 배정
router.post('/store/:storeId',
  authMiddleware,
  checkStorePermission('staff:manage'),
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      const storeId = parseInt(req.params.storeId);

      // 필수 필드 검증
      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: '이름, 이메일, 비밀번호, 역할은 필수입니다' });
      }

      // 역할 검증
      if (!['admin', 'manager', 'staff', 'kitchen'].includes(role)) {
        return res.status(400).json({ error: '유효하지 않은 역할입니다' });
      }

      // admin 역할은 owner만 부여 가능
      if (role === 'admin' && req.storeRole !== 'owner') {
        return res.status(403).json({ error: '관리자 역할은 대표만 부여할 수 있습니다' });
      }

      // 비밀번호 길이 검증
      if (password.length < 6) {
        return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다' });
      }

      // 이미 해당 매장에 등록된 직원인지 확인
      const existingStaff = StoreStaff.findByEmailAndStore(email, storeId);
      if (existingStaff) {
        if (existingStaff.is_active) {
          return res.status(400).json({ error: '이미 등록된 직원입니다' });
        } else {
          // 비활성화된 직원이면 다시 활성화
          const reactivated = StoreStaff.activate(existingStaff.id);
          StoreStaff.updateRole(existingStaff.id, role);
          return res.json({
            ...StoreStaff.findById(existingStaff.id),
            role_label: ROLE_LABELS[role],
            message: '기존 직원이 다시 활성화되었습니다'
          });
        }
      }

      // 기존 사용자 확인 또는 새 사용자 생성
      let user = User.findByEmail(email);

      if (!user) {
        // 새 사용자 생성
        user = await User.create(name, email, password);
      }

      // 직원 등록
      const staffRecord = StoreStaff.create(storeId, user.id, role);

      res.status(201).json({
        ...staffRecord,
        role_label: ROLE_LABELS[role]
      });
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: '이미 등록된 이메일입니다' });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// 직원 역할 변경
router.put('/:id',
  authMiddleware,
  async (req, res) => {
    try {
      const staffRecord = StoreStaff.findById(req.params.id);
      if (!staffRecord) {
        return res.status(404).json({ error: '직원을 찾을 수 없습니다' });
      }

      // 권한 확인
      const requesterRole = getStoreRole(req.user.id, staffRecord.store_id);
      if (!requesterRole || !['owner', 'admin'].includes(requesterRole)) {
        return res.status(403).json({ error: '권한이 없습니다' });
      }

      const { role } = req.body;

      // 역할 검증
      if (!['admin', 'manager', 'staff', 'kitchen'].includes(role)) {
        return res.status(400).json({ error: '유효하지 않은 역할입니다' });
      }

      // admin 역할은 owner만 부여 가능
      if (role === 'admin' && requesterRole !== 'owner') {
        return res.status(403).json({ error: '관리자 역할은 대표만 부여할 수 있습니다' });
      }

      // admin 직원의 역할 변경은 owner만 가능
      if (staffRecord.role === 'admin' && requesterRole !== 'owner') {
        return res.status(403).json({ error: '관리자 직원의 역할은 대표만 변경할 수 있습니다' });
      }

      const updated = StoreStaff.updateRole(req.params.id, role);
      res.json({
        ...updated,
        role_label: ROLE_LABELS[role]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// 직원 삭제 (비활성화)
router.delete('/:id',
  authMiddleware,
  async (req, res) => {
    try {
      const staffRecord = StoreStaff.findById(req.params.id);
      if (!staffRecord) {
        return res.status(404).json({ error: '직원을 찾을 수 없습니다' });
      }

      // 권한 확인
      const requesterRole = getStoreRole(req.user.id, staffRecord.store_id);
      if (!requesterRole || !['owner', 'admin'].includes(requesterRole)) {
        return res.status(403).json({ error: '권한이 없습니다' });
      }

      // admin 직원은 owner만 삭제 가능
      if (staffRecord.role === 'admin' && requesterRole !== 'owner') {
        return res.status(403).json({ error: '관리자 직원은 대표만 삭제할 수 있습니다' });
      }

      StoreStaff.deactivate(req.params.id);
      res.json({ message: '직원이 삭제되었습니다' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// 내가 접근 가능한 매장 목록 (소유 + 직원)
router.get('/my-stores',
  authMiddleware,
  (req, res) => {
    try {
      // 소유 매장
      const ownedStores = Store.findByOwnerId(req.user.id).map(s => ({
        ...s,
        role: 'owner',
        role_label: ROLE_LABELS.owner
      }));

      // 직원으로 등록된 매장
      const staffStores = StoreStaff.findStoresByUserId(req.user.id).map(s => ({
        ...s,
        role_label: ROLE_LABELS[s.role]
      }));

      // 중복 제거 (소유 매장 우선)
      const storeMap = new Map();
      ownedStores.forEach(s => storeMap.set(s.id, s));
      staffStores.forEach(s => {
        if (!storeMap.has(s.id)) {
          storeMap.set(s.id, s);
        }
      });

      res.json(Array.from(storeMap.values()));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// 내 역할 확인 (특정 매장)
router.get('/my-role/:storeId',
  authMiddleware,
  (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const role = getStoreRole(req.user.id, storeId);

      if (!role) {
        return res.status(403).json({ error: '해당 매장에 대한 접근 권한이 없습니다' });
      }

      res.json({
        store_id: storeId,
        role: role,
        role_label: ROLE_LABELS[role]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// 역할 목록 조회 (프론트엔드용)
router.get('/roles', (req, res) => {
  const roles = [
    { code: 'admin', label: '관리자', description: '직원관리, 설정, 주문, 메뉴, 테이블, 통계' },
    { code: 'manager', label: '매니저', description: '주문, 메뉴, 통계' },
    { code: 'staff', label: '직원', description: '주문 처리' },
    { code: 'kitchen', label: '주방', description: '주문 확인만' }
  ];
  res.json(roles);
});

module.exports = router;
