const db = require('../config/database');

// order_status_logs 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS order_status_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

const OrderLog = {
  // 로그 생성
  create: (orderId, userId, oldStatus, newStatus) => {
    const stmt = db.prepare(`
      INSERT INTO order_status_logs (order_id, user_id, old_status, new_status)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(orderId, userId, oldStatus, newStatus);
    return result.lastInsertRowid;
  },

  // 주문별 상태 변경 이력 조회
  findByOrder: (orderId) => {
    const stmt = db.prepare(`
      SELECT osl.*, u.name as user_name
      FROM order_status_logs osl
      JOIN users u ON osl.user_id = u.id
      WHERE osl.order_id = ?
      ORDER BY osl.changed_at DESC
    `);
    return stmt.all(orderId);
  },

  // 직원별 처리 통계 (분석용)
  getStaffStats: (storeId, startDate, endDate) => {
    const stmt = db.prepare(`
      SELECT
        u.id,
        u.name,
        COALESCE(ss.role, 'owner') as role,
        COUNT(DISTINCT osl.order_id) as orders_processed,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as total_sales,
        COUNT(DISTINCT CASE WHEN osl.new_status = 'completed' THEN osl.order_id END) as completed_orders
      FROM order_status_logs osl
      JOIN users u ON osl.user_id = u.id
      JOIN orders o ON osl.order_id = o.id
      LEFT JOIN store_staff ss ON ss.user_id = u.id AND ss.store_id = o.store_id
      WHERE o.store_id = ?
        AND osl.new_status IN ('confirmed', 'preparing', 'ready', 'completed')
        AND date(osl.changed_at) BETWEEN ? AND ?
      GROUP BY u.id
      ORDER BY orders_processed DESC
    `);
    return stmt.all(storeId, startDate, endDate);
  },

  // 주문 처리 시간 계산 (pending -> completed)
  getProcessingTime: (orderId) => {
    const stmt = db.prepare(`
      SELECT
        MIN(CASE WHEN new_status = 'confirmed' THEN changed_at END) as confirmed_at,
        MAX(CASE WHEN new_status = 'completed' THEN changed_at END) as completed_at
      FROM order_status_logs
      WHERE order_id = ?
    `);
    const result = stmt.get(orderId);
    if (result && result.confirmed_at && result.completed_at) {
      const confirmed = new Date(result.confirmed_at);
      const completed = new Date(result.completed_at);
      return Math.round((completed - confirmed) / 60000); // 분 단위
    }
    return null;
  }
};

module.exports = OrderLog;
