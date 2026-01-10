/**
 * 주문 준비 완료 알림 발송
 * @param {Object} io - Socket.io 인스턴스
 * @param {Object} order - 주문 정보
 * @param {Object} tableAssignment - 테이블 담당자 정보
 */
function sendOrderReadyNotification(io, order, tableAssignment) {
  const notification = {
    type: 'ORDER_READY',
    orderId: order.id,
    orderNumber: order.order_number,
    tableId: order.table_id,
    tableName: order.table_name,
    storeId: order.store_id,
    message: `주문 #${order.order_number || order.id}이 준비되었습니다!`,
    timestamp: new Date().toISOString()
  };

  // 1. 고객에게 전송 (주문별 룸)
  io.to(`order-${order.id}`).emit('notification', {
    ...notification,
    target: 'customer'
  });

  // 2. 테이블 담당 직원에게 전송
  if (tableAssignment?.staff_user_id) {
    io.to(`user-${tableAssignment.staff_user_id}`).emit('notification', {
      ...notification,
      target: 'staff',
      staffName: tableAssignment.staff_name
    });
  }

  // 3. 매장 전체 (매니저/관리자)에게 전송
  io.to(`store-${order.store_id}`).emit('notification', {
    ...notification,
    target: 'manager'
  });

  console.log(`[Notification] Order #${order.id} ready - sent to customer, staff, and managers`);
}

/**
 * 새 주문 알림 발송 (주방/직원용)
 * @param {Object} io - Socket.io 인스턴스
 * @param {Object} order - 주문 정보
 * @param {Object} tableAssignment - 테이블 담당자 정보 (optional)
 */
function sendNewOrderNotification(io, order, tableAssignment) {
  const notification = {
    type: 'NEW_ORDER',
    orderId: order.id,
    orderNumber: order.order_number,
    tableId: order.table_id,
    tableName: order.table_name,
    storeId: order.store_id,
    totalAmount: order.total_amount,
    estimatedMinutes: order.estimated_minutes,
    message: `새 주문이 접수되었습니다! (${order.table_name || '포장'})`,
    timestamp: new Date().toISOString()
  };

  // 1. 매장 전체 직원에게 전송
  io.to(`store-${order.store_id}`).emit('notification', {
    ...notification,
    target: 'store'
  });

  // 2. 주방 전용 알림
  io.to(`kitchen-${order.store_id}`).emit('notification', {
    ...notification,
    target: 'kitchen'
  });

  // 3. 테이블 담당 직원에게 전송
  if (tableAssignment?.staff_user_id) {
    io.to(`user-${tableAssignment.staff_user_id}`).emit('notification', {
      ...notification,
      target: 'table_staff',
      staffName: tableAssignment.staff_name
    });
    console.log(`[Notification] New order #${order.id} - sent to table staff ${tableAssignment.staff_user_id}`);
  }

  console.log(`[Notification] New order #${order.id} - sent to store ${order.store_id} and kitchen`);
}

/**
 * 주문 상태 변경 알림
 * @param {Object} io - Socket.io 인스턴스
 * @param {Object} order - 주문 정보
 * @param {string} oldStatus - 이전 상태
 * @param {string} newStatus - 새 상태
 */
function sendOrderStatusNotification(io, order, oldStatus, newStatus) {
  const statusLabels = {
    pending: '대기중',
    confirmed: '주문확인',
    preparing: '조리중',
    ready: '준비완료',
    completed: '완료',
    cancelled: '취소'
  };

  const notification = {
    type: 'ORDER_STATUS_CHANGED',
    orderId: order.id,
    orderNumber: order.order_number,
    tableId: order.table_id,
    storeId: order.store_id,
    oldStatus,
    newStatus,
    message: `주문이 "${statusLabels[newStatus] || newStatus}" 상태로 변경되었습니다.`,
    timestamp: new Date().toISOString()
  };

  // 고객에게 전송
  io.to(`order-${order.id}`).emit('notification', {
    ...notification,
    target: 'customer'
  });

  console.log(`[Notification] Order #${order.id} status: ${oldStatus} -> ${newStatus}`);
}

/**
 * 주문 접수 알림 (주방 → 고객)
 * @param {Object} io - Socket.io 인스턴스
 * @param {Object} order - 주문 정보
 */
function sendOrderConfirmedNotification(io, order) {
  const notification = {
    type: 'ORDER_CONFIRMED',
    orderId: order.id,
    orderNumber: order.order_number,
    tableId: order.table_id,
    storeId: order.store_id,
    estimatedMinutes: order.estimated_minutes,
    queueNumber: order.queue_number,
    message: order.estimated_minutes
      ? `주문이 접수되었습니다! 예상 조리시간: 약 ${order.estimated_minutes}분`
      : '주문이 접수되었습니다!',
    timestamp: new Date().toISOString()
  };

  // 고객에게 전송
  io.to(`order-${order.id}`).emit('notification', {
    ...notification,
    target: 'customer'
  });

  console.log(`[Notification] Order #${order.id} confirmed - sent to customer (estimated: ${order.estimated_minutes}min)`);
}

module.exports = {
  sendOrderReadyNotification,
  sendNewOrderNotification,
  sendOrderStatusNotification,
  sendOrderConfirmedNotification
};
