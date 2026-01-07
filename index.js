require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const customersRouter = require('./routes/customers');

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

// 인증 API 라우트
app.use('/api/auth', authRouter);

// 사용자 API 라우트
app.use('/api/users', usersRouter);

// 고객 API 라우트
app.use('/api/customers', customersRouter);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
