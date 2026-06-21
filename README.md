# 하루예약 — 시설 예약 시스템

대학교 웹 프레임워크 수업 프로젝트. Node.js + Express 5 기반의 시설 예약 웹 애플리케이션입니다.

**라이브 데모**: https://web-framework-project-yr8g.onrender.com

## 주요 기능

- 시설 목록 조회 및 카테고리·이름 검색
- 날짜별 예약 가능 시간 확인
- 예약 신청 (시간 범위 선택, 목적 입력)
- 내 예약 목록 확인 및 취소
- **관리자**: 시설 CRUD, 예약 승인/반려 (중복 충돌 자동 재검증)
- RBAC — `admin` / `user` 역할 분리, JWT 쿠키 인증

## 기술 스택

| 영역 | 기술 |
|---|---|
| 런타임 | Node.js (CommonJS) |
| 웹 프레임워크 | Express 5 |
| 템플릿 | EJS + express-ejs-layouts |
| 데이터베이스 | MongoDB + Mongoose |
| 인증 | JWT (쿠키) + bcrypt |
| 배포 | Render (free plan) + MongoDB Atlas |

## 로컬 실행

**요구 사항**: Node.js 18+, MongoDB 로컬 실행 중

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env   # 파일이 없으면 직접 생성
# .env 에 아래 두 줄 입력:
# MONGODB_URI=mongodb://127.0.0.1:27017/web_framework_project
# JWT_SECRET=your-secret-here

# 3. 관리자 계정 생성 (환경변수 필수)
ADMIN_USERNAME=admin ADMIN_PASSWORD=yourpassword npm run seed:admin

# 4. 샘플 시설 데이터 입력 (선택)
npm run seed:facilities

# 5. 서버 시작
npm start
# → http://localhost:3000
```

## 프로젝트 구조

```
src/
├── app.js                  # Express 진입점
├── config/db.js            # Mongoose 연결
├── middleware/auth.js      # JWT 인증 미들웨어
├── models/                 # User / Facility / Reservation
├── controllers/            # 라우트 핸들러 계층
├── routes/                 # main.js (공개·유저) / admin.js (관리자)
├── utils/                  # 날짜 포맷, 카테고리·상태 라벨
└── views/                  # EJS 레이아웃 2개 + 파셜 + 9개 페이지
scripts/
├── seedAdmin.js            # 관리자 계정 생성 스크립트
└── seedFacilities.js       # 샘플 시설 데이터 입력 스크립트
public/
├── css/styles.css
└── js/                     # variableProximity.js, homeMeshBackground.js
```

## 환경변수

| 변수 | 설명 |
|---|---|
| `MONGODB_URI` | MongoDB 연결 문자열 |
| `JWT_SECRET` | JWT 서명 키 |
| `PORT` | 서버 포트 (기본값 `3000`) |
