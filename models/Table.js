const db = require('../config/database');
const crypto = require('crypto');

// 테이블 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    qr_code TEXT UNIQUE,
    capacity INTEGER DEFAULT 4,
    is_occupied INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
  )
`);

const Table = {
  findByStoreId: (storeId) => {
    return db.prepare(`
      SELECT * FROM tables
      WHERE store_id = ?
      ORDER BY name ASC
    `).all(storeId);
  },

  findById: (id) => {
    return db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
  },

  findByQrCode: (qrCode) => {
    return db.prepare(`
      SELECT t.*, s.name as store_name, s.is_active as store_active
      FROM tables t
      JOIN stores s ON t.store_id = s.id
      WHERE t.qr_code = ?
    `).get(qrCode);
  },

  create: (data) => {
    const { store_id, name, capacity } = data;
    const qr_code = crypto.randomBytes(8).toString('hex');
    const stmt = db.prepare('INSERT INTO tables (store_id, name, qr_code, capacity) VALUES (?, ?, ?, ?)');
    const result = stmt.run(store_id, name, qr_code, capacity || 4);
    return Table.findById(result.lastInsertRowid);
  },

  update: (id, data) => {
    const { name, capacity, is_occupied, is_active } = data;
    const stmt = db.prepare(`
      UPDATE tables SET
        name = COALESCE(?, name),
        capacity = COALESCE(?, capacity),
        is_occupied = COALESCE(?, is_occupied),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `);
    stmt.run(name, capacity, is_occupied, is_active, id);
    return Table.findById(id);
  },

  regenerateQrCode: (id) => {
    const qr_code = crypto.randomBytes(8).toString('hex');
    db.prepare('UPDATE tables SET qr_code = ? WHERE id = ?').run(qr_code, id);
    return Table.findById(id);
  },

  delete: (id) => {
    const table = Table.findById(id);
    if (table) {
      db.prepare('DELETE FROM tables WHERE id = ?').run(id);
    }
    return table;
  }
};

module.exports = Table;
