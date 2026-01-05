const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 필수 필드 검증
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password는 필수입니다' });
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return res.status(400).json({ error: '비밀번호는 최소 6자 이상이어야 합니다' });
    }

    // 이메일 중복 확인
    const existingUser = User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: '이미 사용 중인 이메일입니다' });
    }

    // 사용자 생성
    const user = await User.create(name, email, password);

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: '회원가입 성공',
      user,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({ error: 'email과 password는 필수입니다' });
    }

    // 사용자 조회
    const user = User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }

    // 비밀번호 검증
    const isValid = await User.verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: '로그인 성공',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 내 정보 조회 (인증 필요)
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// 비밀번호 변경 (인증 필요)
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호는 필수입니다' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '새 비밀번호는 최소 6자 이상이어야 합니다' });
    }

    // 현재 비밀번호 확인
    const user = User.findByEmail(req.user.email);
    const isValid = await User.verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다' });
    }

    // 비밀번호 변경
    await User.updatePassword(req.user.id, newPassword);

    res.json({ message: '비밀번호가 변경되었습니다' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
