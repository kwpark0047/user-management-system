require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// 라우터 임포트
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const customersRouter = require('./routes/customers');
const storesRouter = require('./routes/stores');
const categoriesRouter = require('./routes/categories');
const productsRouter = require('./routes/products');
const tablesRouter = require('./routes/tables');
const ordersRouter = require('./routes/orders');
const staffRouter = require('./routes/staff');
const analyticsRouter = require('./routes/analytics');
const tableAssignmentsRouter = require('./routes/tableAssignments');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// CORS 설정
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Socket.io 설정
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3002', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true
  }
});

// Socket.io 연결 관리
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // 고객 미니앱: 주문별 룸 조인
  socket.on('join-order', (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`[Socket] ${socket.id} joined order-${orderId}`);
  });

  // 관리자: 매장별 룸 조인
  socket.on('join-store', ({ storeId, userId, role }) => {
    socket.join(`store-${storeId}`);
    if (userId) {
      socket.join(`user-${userId}`);
    }
    console.log(`[Socket] ${socket.id} joined store-${storeId} (user: ${userId}, role: ${role})`);
  });

  // 주방: 주방 전용 룸 조인
  socket.on('join-kitchen', ({ storeId, userId }) => {
    socket.join(`kitchen-${storeId}`);
    if (userId) {
      socket.join(`user-${userId}`);
    }
    console.log(`[Socket] ${socket.id} joined kitchen-${storeId} (user: ${userId})`);
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// io를 app에 저장하여 라우트에서 사용
app.set('io', io);

// JSON 파싱 미들웨어
app.use(express.json());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// API 라우트
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/stores', storesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/staff', staffRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api', tableAssignmentsRouter);

// 서버 시작 (httpServer로 변경)
httpServer.listen(PORT, () => {
  console.log(`위마켓 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log(`Socket.io 서버가 활성화되었습니다`);
});
