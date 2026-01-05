const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');
const db = new Database(dbPath);

// 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 기존 테이블에 password 컬럼 추가 (없는 경우)
try {
  db.exec(`ALTER TABLE users ADD COLUMN password TEXT`);
} catch (e) {
  // 이미 컬럼이 존재하면 무시
}

console.log('SQLite 데이터베이스 연결 성공');

module.exports = db;
