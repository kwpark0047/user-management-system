const db = require('../config/database');
const bcrypt = require('bcrypt');

const User = {
  // 모든 사용자 조회 (비밀번호 제외)
  findAll: () => {
    return db.prepare('SELECT id, name, email, created_at, updated_at FROM users ORDER BY id DESC').all();
  },

  // ID로 사용자 조회 (비밀번호 제외)
  findById: (id) => {
    return db.prepare('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?').get(id);
  },

  // 이메일로 사용자 조회 (비밀번호 포함 - 로그인용)
  findByEmail: (email) => {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  // 사용자 생성 (회원가입)
  create: async (name, email, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(name, email, hashedPassword);
    return User.findById(result.lastInsertRowid);
  },

  // 사용자 수정
  update: (id, name, email) => {
    const stmt = db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(name, email, id);
    return User.findById(id);
  },

  // 비밀번호 변경
  updatePassword: async (id, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const stmt = db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(hashedPassword, id);
    return User.findById(id);
  },

  // 사용자 삭제
  delete: (id) => {
    const user = User.findById(id);
    if (user) {
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    }
    return user;
  },

  // 비밀번호 검증
  verifyPassword: async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
};

module.exports = User;
