# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Backend (root):**
```bash
npm install           # 의존성 설치
npm start             # 서버 실행 (http://localhost:3000)
node scripts/seed.js  # 샘플 데이터 시딩
```

**Frontend (frontend/):**
```bash
cd frontend
npm install           # 프론트엔드 의존성 설치
npm run dev           # Vite 개발 서버 (http://localhost:5173)
npm run build         # 프로덕션 빌드
npm run lint          # ESLint 실행
```

**Toss 미니앱 (frontend/):**
```bash
npm run toss:dev      # granite 개발 모드
npm run toss:build    # granite 빌드
npm run toss:deploy   # ait 배포
```

## Architecture

**WeMarket QR 메뉴** - Toss 앱 내 미니앱으로 동작하는 QR 메뉴 시스템

### Backend (Express + SQLite + Socket.io)

**요청 흐름:** `index.js` → `middleware/auth.js` → `routes/*` → `models/*` → `config/database.js`

- **index.js**: Express 서버 + Socket.io 설정, 모든 라우트 마운트
- **config/database.js**: better-sqlite3 연결 및 모든 테이블 스키마 정의
- **middleware/auth.js**: JWT Bearer 토큰 검증 → `req.user` 설정
- **middleware/storeAuth.js**: 매장 소유권 검증

**Models (models/):**
- User, Store, Category, Product, Table, Order, Customer
- StoreStaff (직원 역할: owner, manager, chef, server)
- TableAssignment (테이블 좌석 배정)
- OrderLog (주문 이력 추적)

**Socket.io 이벤트 (index.js):**
- `joinOrderRoom`, `joinStoreRoom`, `joinUserRoom`: 방 참여
- `orderUpdate`: 주문 상태 변경 브로드캐스트

### Frontend (React 19 + Vite 7 + Tailwind CSS 4)

**구조:**
- `src/App.jsx`: React Router v7 라우트 정의
- `src/api/index.js`: Axios 클라이언트 + 인터셉터 (토큰 자동 첨부)
- `src/contexts/NotificationContext.jsx`: 토스트 알림 Context
- `src/components/admin/`: 관리자 대시보드 (Dashboard, MenuManager, OrderManager, StaffManager, SalesStats, AnalyticsDashboard)
- `src/components/customer/`: 고객용 메뉴 (Menu.jsx)

**Toss 미니앱 연동:**
- `@apps-in-toss/web-bridge`: 토스 앱 브릿지 통신
- `@apps-in-toss/web-framework`: 그래니트 프레임워크

### Database Schema

핵심 테이블 관계:
```
users (1) ─┬─ (N) stores ─┬─ (N) categories ─── (N) products
           │              ├─ (N) tables
           │              ├─ (N) orders ─── (N) order_items
           │              └─ (N) store_staff
           └─ (N) store_staff
```

## Key Patterns

- **Backend**: CommonJS (`require`/`module.exports`), 동기식 SQLite (better-sqlite3)
- **Frontend**: ES Modules, React Router v7, Axios 인터셉터, Socket.io-client
- **인증**: JWT Bearer 토큰, localStorage 저장, `authMiddleware` 적용
- **실시간**: Socket.io로 주문 상태 실시간 업데이트
- **환경변수**: `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`

## API 인증

인증이 필요한 엔드포인트는 헤더에 `Authorization: Bearer <token>` 필요
- 공개 API: 매장 조회, 카테고리/상품 조회, QR 코드 조회, 주문 생성
- 인증 필요: 매장/메뉴 관리, 주문 상태 변경, 직원 관리, 통계 조회
