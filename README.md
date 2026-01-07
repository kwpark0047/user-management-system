# User Management System + CRM

Express + SQLite 기반 사용자 관리 및 고객 관리(CRM) 시스템

## 기능

### 사용자 관리
- JWT 기반 인증 (회원가입/로그인)
- 사용자 CRUD API

### CRM (고객 관리)
- 고객 목록 조회 및 검색
- 고객 상세 정보 관리
- 고객 상태 관리 (활성/비활성/잠재고객)
- 통계 대시보드

## 기술 스택

- **Backend:** Node.js, Express
- **Database:** SQLite (better-sqlite3)
- **Authentication:** JWT, bcrypt
- **Frontend (CRM):** React, Vite, Tailwind CSS
- **Frontend (Legacy):** HTML, CSS, JavaScript (Vanilla)

## 설치 및 실행

### 백엔드

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env

# 서버 실행
npm start
```

서버 실행 후 http://localhost:3000 접속

### 프론트엔드 (CRM)

```bash
# 프론트엔드 폴더로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드: http://localhost:5173

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

### 고객 (CRM)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/customers | 고객 목록 조회 | X |
| GET | /api/customers/:id | 고객 상세 조회 | X |
| GET | /api/customers/stats | 고객 통계 조회 | X |
| POST | /api/customers | 고객 생성 | O |
| PUT | /api/customers/:id | 고객 수정 | O |
| DELETE | /api/customers/:id | 고객 삭제 | O |

**검색:** `GET /api/customers?search=검색어`

## 프로젝트 구조

```
├── config/
│   └── database.js        # SQLite 연결 설정
├── middleware/
│   └── auth.js            # JWT 인증 미들웨어
├── models/
│   ├── User.js            # 사용자 모델
│   └── Customer.js        # 고객 모델
├── routes/
│   ├── auth.js            # 인증 라우트
│   ├── users.js           # 사용자 라우트
│   └── customers.js       # 고객 라우트
├── public/                # Legacy 프론트엔드
├── frontend/              # React CRM 프론트엔드
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── context/       # Auth Context
│   │   └── api/           # API 클라이언트
│   └── package.json
├── data/
│   └── database.sqlite    # SQLite DB 파일
├── .env                   # 환경변수
├── index.js               # 서버 엔트리포인트
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

### 고객 생성

```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"삼성전자","email":"samsung@example.com","phone":"02-1234-5678","company":"삼성그룹","status":"active"}'
```

### 고객 목록 검색

```bash
curl "http://localhost:3000/api/customers?search=삼성"
```

## 라이선스

ISC
