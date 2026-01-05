# User Management System

Express + SQLite 기반 사용자 관리 시스템

## 기능

- JWT 기반 인증 (회원가입/로그인)
- 사용자 CRUD API
- 반응형 프론트엔드 UI

## 기술 스택

- **Backend:** Node.js, Express
- **Database:** SQLite (better-sqlite3)
- **Authentication:** JWT, bcrypt
- **Frontend:** HTML, CSS, JavaScript (Vanilla)

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env

# 서버 실행
npm start
```

서버 실행 후 http://localhost:3000 접속

## 환경변수 (.env)

```
PORT=3000
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

## API 엔드포인트

### 인증

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | 회원가입 | X |
| POST | /api/auth/login | 로그인 | X |
| GET | /api/auth/me | 내 정보 조회 | O |
| PUT | /api/auth/password | 비밀번호 변경 | O |

### 사용자

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/users | 전체 사용자 조회 | X |
| GET | /api/users/:id | 특정 사용자 조회 | X |
| PUT | /api/users/:id | 사용자 수정 | O |
| DELETE | /api/users/:id | 사용자 삭제 | O |

## 프로젝트 구조

```
├── config/
│   └── database.js      # SQLite 연결 설정
├── middleware/
│   └── auth.js          # JWT 인증 미들웨어
├── models/
│   └── User.js          # 사용자 모델
├── public/
│   ├── index.html       # 프론트엔드 HTML
│   ├── style.css        # 스타일시트
│   └── app.js           # 프론트엔드 JS
├── routes/
│   ├── auth.js          # 인증 라우트
│   └── users.js         # 사용자 라우트
├── data/
│   └── database.sqlite  # SQLite DB 파일
├── .env                 # 환경변수
├── .gitignore
├── index.js             # 서버 엔트리포인트
└── package.json
```

## API 사용 예시

### 회원가입

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"홍길동","email":"hong@example.com","password":"password123"}'
```

### 로그인

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hong@example.com","password":"password123"}'
```

### 인증된 요청

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

## 라이선스

ISC
