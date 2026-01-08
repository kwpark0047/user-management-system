const db = require('../config/database');

// store_staff 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS store_staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'staff', 'kitchen')),
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(store_id, user_id)
  )
`);

const StoreStaff = {
  // 매장의 모든 직원 조회
  findByStoreId: (storeId) => {
    return db.prepare(`
      SELECT ss.*, u.name, u.email
      FROM store_staff ss
      JOIN users u ON ss.user_id = u.id
      WHERE ss.store_id = ? AND ss.is_active = 1
      ORDER BY
        CASE ss.role
          WHEN 'admin' THEN 1
          WHEN 'manager' THEN 2
          WHEN 'staff' THEN 3
          WHEN 'kitchen' THEN 4
        END,
        ss.created_at DESC
    `).all(storeId);
  },

  // 특정 사용자의 매장 역할 조회
  findByUserAndStore: (userId, storeId) => {
    return db.prepare(`
      SELECT ss.*, u.name, u.email
      FROM store_staff ss
      JOIN users u ON ss.user_id = u.id
      WHERE ss.user_id = ? AND ss.store_id = ? AND ss.is_active = 1
    `).get(userId, storeId);
  },

  // 사용자가 접근 가능한 모든 매장 조회 (직원으로 등록된 매장)
  findStoresByUserId: (userId) => {
    return db.prepare(`
      SELECT s.*, ss.role
      FROM store_staff ss
      JOIN stores s ON ss.store_id = s.id
      WHERE ss.user_id = ? AND ss.is_active = 1
      ORDER BY s.id DESC
    `).all(userId);
  },

  // ID로 직원 조회
  findById: (id) => {
    return db.prepare(`
      SELECT ss.*, u.name, u.email
      FROM store_staff ss
      JOIN users u ON ss.user_id = u.id
      WHERE ss.id = ?
    `).get(id);
  },

  // 직원 추가
  create: (storeId, userId, role) => {
    const stmt = db.prepare(`
      INSERT INTO store_staff (store_id, user_id, role)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(storeId, userId, role);
    return StoreStaff.findById(result.lastInsertRowid);
  },

  // 역할 변경
  updateRole: (id, role) => {
    db.prepare(`
      UPDATE store_staff
      SET role = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(role, id);
    return StoreStaff.findById(id);
  },

  // 직원 비활성화
  deactivate: (id) => {
    db.prepare(`
      UPDATE store_staff
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);
  },

  // 직원 활성화
  activate: (id) => {
    db.prepare(`
      UPDATE store_staff
      SET is_active = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);
    return StoreStaff.findById(id);
  },

  // 직원 삭제
  delete: (id) => {
    db.prepare('DELETE FROM store_staff WHERE id = ?').run(id);
  },

  // 이메일로 기존 직원 확인 (비활성화된 직원 포함)
  findByEmailAndStore: (email, storeId) => {
    return db.prepare(`
      SELECT ss.*, u.name, u.email
      FROM store_staff ss
      JOIN users u ON ss.user_id = u.id
      WHERE u.email = ? AND ss.store_id = ?
    `).get(email, storeId);
  }
};

module.exports = StoreStaff;
