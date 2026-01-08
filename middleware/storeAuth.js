const Store = require('../models/Store');
const StoreStaff = require('../models/StoreStaff');

// 역할별 권한 레벨 (높을수록 더 많은 권한)
const ROLE_LEVELS = {
  owner: 100,
  admin: 80,
  manager: 60,
  staff: 40,
  kitchen: 20
};

// 기능별 허용 역할
const REQUIRED_PERMISSIONS = {
  // 매장 설정
  'store:settings': ['owner', 'admin'],
  'store:delete': ['owner'],

  // 직원 관리
  'staff:manage': ['owner', 'admin'],

  // 메뉴 관리
  'menu:read': ['owner', 'admin', 'manager', 'staff', 'kitchen'],
  'menu:write': ['owner', 'admin', 'manager'],

  // 카테고리 관리
  'category:read': ['owner', 'admin', 'manager', 'staff', 'kitchen'],
  'category:write': ['owner', 'admin', 'manager'],

  // 테이블 관리
  'table:read': ['owner', 'admin', 'manager', 'staff', 'kitchen'],
  'table:manage': ['owner', 'admin'],

  // 주문 관리
  'order:read': ['owner', 'admin', 'manager', 'staff', 'kitchen'],
  'order:write': ['owner', 'admin', 'manager', 'staff'],

  // 통계
  'stats:read': ['owner', 'admin', 'manager'],

  // 분석 대시보드 (대표 전용)
  'analytics:read': ['owner']
};

// 역할 한글명
const ROLE_LABELS = {
  owner: '대표',
  admin: '관리자',
  manager: '매니저',
  staff: '직원',
  kitchen: '주방'
};

/**
 * 사용자의 매장 역할 가져오기
 * @param {number} userId - 사용자 ID
 * @param {number} storeId - 매장 ID
 * @returns {string|null} 역할 또는 null
 */
const getStoreRole = (userId, storeId) => {
  const store = Store.findById(storeId);
  if (!store) return null;

  // 소유자 확인
  if (store.owner_id === userId) {
    return 'owner';
  }

  // 직원 역할 확인
  const staffRecord = StoreStaff.findByUserAndStore(userId, storeId);
  if (staffRecord && staffRecord.is_active) {
    return staffRecord.role;
  }

  return null;
};

/**
 * 권한 체크 미들웨어 팩토리
 * @param {string} permission - 필요한 권한 (예: 'order:read')
 */
const checkStorePermission = (permission) => {
  return (req, res, next) => {
    try {
      // storeId 추출 (여러 위치에서 확인)
      const storeId = req.params.storeId || req.params.id || req.body.store_id;

      if (!storeId) {
        return res.status(400).json({ error: '매장 ID가 필요합니다' });
      }

      const role = getStoreRole(req.user.id, parseInt(storeId));

      if (!role) {
        return res.status(403).json({ error: '해당 매장에 대한 접근 권한이 없습니다' });
      }

      const allowedRoles = REQUIRED_PERMISSIONS[permission];

      if (!allowedRoles || !allowedRoles.includes(role)) {
        return res.status(403).json({
          error: '권한이 없습니다',
          required: permission,
          yourRole: role
        });
      }

      // 역할 정보를 req에 추가
      req.storeRole = role;
      req.storeId = parseInt(storeId);

      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

/**
 * 매장 접근 권한만 체크 (어떤 역할이든 접근 가능)
 */
const checkStoreAccess = (req, res, next) => {
  try {
    const storeId = req.params.storeId || req.params.id || req.body.store_id;

    if (!storeId) {
      return res.status(400).json({ error: '매장 ID가 필요합니다' });
    }

    const role = getStoreRole(req.user.id, parseInt(storeId));

    if (!role) {
      return res.status(403).json({ error: '해당 매장에 대한 접근 권한이 없습니다' });
    }

    req.storeRole = role;
    req.storeId = parseInt(storeId);

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 특정 역할 이상인지 확인
 * @param {string} userRole - 사용자 역할
 * @param {string} requiredRole - 필요한 최소 역할
 */
const hasMinimumRole = (userRole, requiredRole) => {
  return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[requiredRole] || 100);
};

module.exports = {
  checkStorePermission,
  checkStoreAccess,
  getStoreRole,
  hasMinimumRole,
  REQUIRED_PERMISSIONS,
  ROLE_LEVELS,
  ROLE_LABELS
};
