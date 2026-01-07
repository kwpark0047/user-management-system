const db = require('../config/database');

// 고객 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const Customer = {
  // 모든 고객 조회
  findAll: (search = '') => {
    if (search) {
      return db.prepare(`
        SELECT * FROM customers
        WHERE name LIKE ? OR email LIKE ? OR company LIKE ? OR phone LIKE ?
        ORDER BY id DESC
      `).all(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    return db.prepare('SELECT * FROM customers ORDER BY id DESC').all();
  },

  // ID로 고객 조회
  findById: (id) => {
    return db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  },

  // 고객 생성
  create: (data) => {
    const { name, email, phone, company, status, notes } = data;
    const stmt = db.prepare(`
      INSERT INTO customers (name, email, phone, company, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, email || null, phone || null, company || null, status || 'active', notes || null);
    return Customer.findById(result.lastInsertRowid);
  },

  // 고객 수정
  update: (id, data) => {
    const { name, email, phone, company, status, notes } = data;
    const stmt = db.prepare(`
      UPDATE customers
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          company = COALESCE(?, company),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(name, email, phone, company, status, notes, id);
    return Customer.findById(id);
  },

  // 고객 삭제
  delete: (id) => {
    const customer = Customer.findById(id);
    if (customer) {
      db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    }
    return customer;
  },

  // 통계
  getStats: () => {
    const total = db.prepare('SELECT COUNT(*) as count FROM customers').get();
    const active = db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'active'").get();
    const inactive = db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'inactive'").get();
    const lead = db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'lead'").get();
    return {
      total: total.count,
      active: active.count,
      inactive: inactive.count,
      lead: lead.count
    };
  }
};

module.exports = Customer;
