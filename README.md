# 위마켓 (WeMarket) - QR 메뉴판 플랫폼

QR 코드 기반 매장 메뉴 조회, 주문, 결제를 통합 제공하는 웹앱 서비스

## 주요 기능

### 매장 관리자
- 매장 등록 및 정보 관리
- 메뉴 카테고리 및 상품 관리
- 테이블 등록 및 QR 코드 자동 생성
- 실시간 주문 현황 및 매출 통계

### 고객 (QR 스캔)
- QR 코드 스캔으로 메뉴 조회
- 모바일 주문 및 요청사항 입력
- 장바구니 및 주문 확인

## 기술 스택

- **Backend:** Node.js, Express, SQLite (better-sqlite3)
- **Frontend:** React, Vite, Tailwind CSS
- **Authentication:** JWT, bcrypt
- **QR Code:** qrcode 라이브러리

## 설치 및 실행

### 백엔드

```bash
npm install
cp .env.example .env
npm start
```

서버: http://localhost:3000

### 프론트엔드

```bash
cd frontend
npm install
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

### 매장

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/stores | 전체 매장 조회 | X |
| GET | /api/stores/my | 내 매장 조회 | O |
| POST | /api/stores | 매장 등록 | O |
| PUT | /api/stores/:id | 매장 수정 | O |
| DELETE | /api/stores/:id | 매장 삭제 | O |

### 카테고리

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/categories/store/:storeId | 매장별 카테고리 조회 | X |
| POST | /api/categories | 카테고리 생성 | O |
| PUT | /api/categories/:id | 카테고리 수정 | O |
| DELETE | /api/categories/:id | 카테고리 삭제 | O |

### 상품 (메뉴)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/products/store/:storeId | 매장별 상품 조회 | X |
| POST | /api/products | 상품 등록 | O |
| PUT | /api/products/:id | 상품 수정 | O |
| DELETE | /api/products/:id | 상품 삭제 | O |

### 테이블

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/tables/store/:storeId | 매장별 테이블 조회 | X |
| GET | /api/tables/qr/:qrCode | QR 코드로 테이블 조회 | X |
| POST | /api/tables | 테이블 등록 | O |
| POST | /api/tables/:id/regenerate-qr | QR 코드 재생성 | O |
| DELETE | /api/tables/:id | 테이블 삭제 | O |

### 주문

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/orders/store/:storeId | 매장별 주문 조회 | O |
| GET | /api/orders/store/:storeId/stats | 매출 통계 | O |
| POST | /api/orders | 주문 생성 | X |
| PUT | /api/orders/:id/status | 주문 상태 변경 | O |
| PUT | /api/orders/:id/payment | 결제 정보 업데이트 | O |

## 프로젝트 구조

```
├── config/
│   └── database.js          # SQLite 연결
├── middleware/
│   └── auth.js              # JWT 인증
├── models/
│   ├── User.js              # 사용자
│   ├── Store.js             # 매장
│   ├── Category.js          # 카테고리
│   ├── Product.js           # 상품
│   ├── Table.js             # 테이블
│   └── Order.js             # 주문
├── routes/
│   ├── auth.js              # 인증 API
│   ├── stores.js            # 매장 API
│   ├── categories.js        # 카테고리 API
│   ├── products.js          # 상품 API
│   ├── tables.js            # 테이블 API
│   └── orders.js            # 주문 API
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── admin/       # 관리자 페이지
│       │   └── customer/    # 고객 메뉴 페이지
│       ├── context/         # Auth Context
│       └── api/             # API 클라이언트
├── index.js                 # 서버 엔트리포인트
└── package.json
```

## 사용 방법

1. 회원가입 및 로그인
2. 매장 등록 (`/admin`)
3. 카테고리 및 메뉴 등록
4. 테이블 등록 후 QR 코드 다운로드
5. 고객이 QR 스캔하여 주문 (`/menu/:qrCode`)

## 라이선스

ISC
