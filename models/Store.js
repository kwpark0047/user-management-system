const db = require('../config/database');

// 매장 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    business_type TEXT DEFAULT '음식점',
    open_time TEXT DEFAULT '09:00',
    close_time TEXT DEFAULT '22:00',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
  )
`);

const Store = {
  findAll: () => {
    return db.prepare(`
      SELECT s.*, u.name as owner_name
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      ORDER BY s.id DESC
    `).all();
  },

  findById: (id) => {
    return db.prepare(`
      SELECT s.*, u.name as owner_name
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      WHERE s.id = ?
    `).get(id);
  },

  findByOwnerId: (ownerId) => {
    return db.prepare('SELECT * FROM stores WHERE owner_id = ? ORDER BY id DESC').all(ownerId);
  },

  create: (data) => {
    const { owner_id, name, description, address, phone, business_type, open_time, close_time } = data;
    const stmt = db.prepare(`
      INSERT INTO stores (owner_id, name, description, address, phone, business_type, open_time, close_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(owner_id, name, description || null, address || null, phone || null,
      business_type || '음식점', open_time || '09:00', close_time || '22:00');
    return Store.findById(result.lastInsertRowid);
  },

  update: (id, data) => {
    const { name, description, address, phone, business_type, open_time, close_time, is_active, theme } = data;
    const stmt = db.prepare(`
      UPDATE stores SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        address = COALESCE(?, address),
        phone = COALESCE(?, phone),
        business_type = COALESCE(?, business_type),
        open_time = COALESCE(?, open_time),
        close_time = COALESCE(?, close_time),
        is_active = COALESCE(?, is_active),
        theme = COALESCE(?, theme),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(name, description, address, phone, business_type, open_time, close_time, is_active, theme, id);
    return Store.findById(id);
  },

  delete: (id) => {
    const store = Store.findById(id);
    if (store) {
      db.prepare('DELETE FROM stores WHERE id = ?').run(id);
    }
    return store;
  }
};

module.exports = Store;
