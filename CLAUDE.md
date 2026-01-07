# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install    # 의존성 설치
npm start      # 서버 실행 (http://localhost:3000)
```

## Architecture

Express + SQLite 기반 사용자 관리 시스템 (JWT 인증)

**흐름:** `index.js` (엔트리포인트) → `routes/` → `models/User.js` → `config/database.js` (SQLite)

- **config/database.js**: better-sqlite3 연결 및 테이블 스키마 정의
- **models/User.js**: 사용자 CRUD 및 bcrypt 비밀번호 처리
- **middleware/auth.js**: JWT Bearer 토큰 검증, `req.user` 설정
- **routes/auth.js**: 회원가입, 로그인, 내 정보, 비밀번호 변경
- **routes/users.js**: 사용자 목록/조회(공개), 수정/삭제(인증 필요)
- **public/**: 프론트엔드 정적 파일 (Vanilla JS)

## Key Patterns

- CommonJS 모듈 시스템 (`require`/`module.exports`)
- 동기식 SQLite 쿼리 (better-sqlite3), 비밀번호 해싱만 async
- 인증 필요 라우트에 `authMiddleware` 적용
- 환경변수: `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`
