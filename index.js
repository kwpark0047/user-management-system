require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

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

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

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

// 서버 시작
app.listen(PORT, () => {
  console.log(`위마켓 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
