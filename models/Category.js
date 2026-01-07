const db = require('../config/database');

// 카테고리 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
  )
`);

const Category = {
  findByStoreId: (storeId) => {
    return db.prepare(`
      SELECT * FROM categories
      WHERE store_id = ?
      ORDER BY sort_order ASC, id ASC
    `).all(storeId);
  },

  findById: (id) => {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  },

  create: (data) => {
    const { store_id, name, sort_order } = data;
    const stmt = db.prepare('INSERT INTO categories (store_id, name, sort_order) VALUES (?, ?, ?)');
    const result = stmt.run(store_id, name, sort_order || 0);
    return Category.findById(result.lastInsertRowid);
  },

  update: (id, data) => {
    const { name, sort_order, is_active } = data;
    const stmt = db.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        sort_order = COALESCE(?, sort_order),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `);
    stmt.run(name, sort_order, is_active, id);
    return Category.findById(id);
  },

  delete: (id) => {
    const category = Category.findById(id);
    if (category) {
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    }
    return category;
  }
};

module.exports = Category;
