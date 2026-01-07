const db = require('../config/database');

// 주문 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    table_id INTEGER,
    order_number TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    status TEXT DEFAULT 'pending',
    total_amount INTEGER DEFAULT 0,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'unpaid',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (table_id) REFERENCES tables(id)
  )
`);

// 주문 상세 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    subtotal INTEGER NOT NULL,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )
`);

const Order = {
  generateOrderNumber: (storeId) => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE store_id = ? AND date(created_at) = date('now')
    `).get(storeId).count;
    return `${today}-${String(count + 1).padStart(4, '0')}`;
  },

  findByStoreId: (storeId, status = null, date = null) => {
    let query = `
      SELECT o.*, t.name as table_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE o.store_id = ?
    `;
    const params = [storeId];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }
    if (date) {
      query += ' AND date(o.created_at) = ?';
      params.push(date);
    }

    query += ' ORDER BY o.created_at DESC';
    return db.prepare(query).all(...params);
  },

  findById: (id) => {
    const order = db.prepare(`
      SELECT o.*, t.name as table_name, s.name as store_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.id = ?
    `).get(id);

    if (order) {
      order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
    }
    return order;
  },

  create: (data) => {
    const { store_id, table_id, customer_name, customer_phone, notes, items } = data;
    const order_number = Order.generateOrderNumber(store_id);

    // 총 금액 계산
    let total_amount = 0;
    if (items && items.length > 0) {
      total_amount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    const stmt = db.prepare(`
      INSERT INTO orders (store_id, table_id, order_number, customer_name, customer_phone, total_amount, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(store_id, table_id || null, order_number, customer_name || null,
      customer_phone || null, total_amount, notes || null);

    const orderId = result.lastInsertRowid;

    // 주문 상세 저장
    if (items && items.length > 0) {
      const itemStmt = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of items) {
        itemStmt.run(orderId, item.product_id, item.product_name, item.price,
          item.quantity, item.price * item.quantity, item.notes || null);
      }
    }

    return Order.findById(orderId);
  },

  updateStatus: (id, status) => {
    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    return Order.findById(id);
  },

  updatePayment: (id, payment_method, payment_status) => {
    db.prepare(`
      UPDATE orders SET payment_method = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(payment_method, payment_status, id);
    return Order.findById(id);
  },

  getStats: (storeId, startDate = null, endDate = null) => {
    let dateFilter = '';
    const params = [storeId];

    if (startDate && endDate) {
      dateFilter = "AND date(created_at) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    } else {
      dateFilter = "AND date(created_at) = date('now')";
    }

    const totalOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE store_id = ? ${dateFilter}
    `).get(...params).count;

    const totalSales = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders
      WHERE store_id = ? AND payment_status = 'paid' ${dateFilter}
    `).get(...params).total;

    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count FROM orders
      WHERE store_id = ? ${dateFilter}
      GROUP BY status
    `).all(...params);

    return {
      total_orders: totalOrders,
      total_sales: totalSales,
      by_status: statusCounts.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {})
    };
  },

  delete: (id) => {
    const order = Order.findById(id);
    if (order) {
      db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    }
    return order;
  }
};

module.exports = Order;
