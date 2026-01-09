const db = require('../config/database');

db.exec(`
  CREATE TABLE IF NOT EXISTS table_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    table_id INTEGER NOT NULL,
    staff_user_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(store_id, table_id)
  )
`);

const TableAssignment = {
  assign: (storeId, tableId, staffUserId) => {
    const existing = db.prepare(
      'SELECT * FROM table_assignments WHERE store_id = ? AND table_id = ?'
    ).get(storeId, tableId);

    if (existing) {
      db.prepare(
        'UPDATE table_assignments SET staff_user_id = ?, assigned_at = CURRENT_TIMESTAMP WHERE store_id = ? AND table_id = ?'
      ).run(staffUserId, storeId, tableId);
    } else {
      db.prepare(
        'INSERT INTO table_assignments (store_id, table_id, staff_user_id) VALUES (?, ?, ?)'
      ).run(storeId, tableId, staffUserId);
    }

    return TableAssignment.getByTable(storeId, tableId);
  },

  getByTable: (storeId, tableId) => {
    return db.prepare(`
      SELECT ta.*, u.name as staff_name, u.email as staff_email
      FROM table_assignments ta
      JOIN users u ON ta.staff_user_id = u.id
      WHERE ta.store_id = ? AND ta.table_id = ?
    `).get(storeId, tableId);
  },

  getByStaff: (storeId, staffUserId) => {
    return db.prepare(`
      SELECT ta.*, t.name as table_name
      FROM table_assignments ta
      JOIN tables t ON ta.table_id = t.id
      WHERE ta.store_id = ? AND ta.staff_user_id = ?
      ORDER BY t.name
    `).all(storeId, staffUserId);
  },

  getAllByStore: (storeId) => {
    return db.prepare(`
      SELECT ta.*, t.name as table_name, u.name as staff_name
      FROM table_assignments ta
      JOIN tables t ON ta.table_id = t.id
      JOIN users u ON ta.staff_user_id = u.id
      WHERE ta.store_id = ?
      ORDER BY t.name
    `).all(storeId);
  },

  removeAssignment: (storeId, tableId) => {
    const existing = TableAssignment.getByTable(storeId, tableId);
    if (existing) {
      db.prepare('DELETE FROM table_assignments WHERE store_id = ? AND table_id = ?').run(storeId, tableId);
    }
    return existing;
  },

  removeByStaff: (storeId, staffUserId) => {
    db.prepare('DELETE FROM table_assignments WHERE store_id = ? AND staff_user_id = ?').run(storeId, staffUserId);
  }
};

module.exports = TableAssignment;
