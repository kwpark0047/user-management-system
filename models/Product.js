const db = require('../config/database');

// 상품 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    category_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    is_sold_out INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  )
`);

const Product = {
  findByStoreId: (storeId, categoryId = null) => {
    if (categoryId) {
      return db.prepare(`
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.store_id = ? AND p.category_id = ?
        ORDER BY p.sort_order ASC, p.id ASC
      `).all(storeId, categoryId);
    }
    return db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.store_id = ?
      ORDER BY c.sort_order ASC, p.sort_order ASC, p.id ASC
    `).all(storeId);
  },

  findById: (id) => {
    return db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);
  },

  create: (data) => {
    const { store_id, category_id, name, description, price, image_url, sort_order } = data;
    const stmt = db.prepare(`
      INSERT INTO products (store_id, category_id, name, description, price, image_url, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(store_id, category_id || null, name, description || null,
      price || 0, image_url || null, sort_order || 0);
    return Product.findById(result.lastInsertRowid);
  },

  update: (id, data) => {
    const { category_id, name, description, price, image_url, is_sold_out, is_active, sort_order } = data;
    const stmt = db.prepare(`
      UPDATE products SET
        category_id = COALESCE(?, category_id),
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        image_url = COALESCE(?, image_url),
        is_sold_out = COALESCE(?, is_sold_out),
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(category_id, name, description, price, image_url, is_sold_out, is_active, sort_order, id);
    return Product.findById(id);
  },

  delete: (id) => {
    const product = Product.findById(id);
    if (product) {
      db.prepare('DELETE FROM products WHERE id = ?').run(id);
    }
    return product;
  }
};

module.exports = Product;
