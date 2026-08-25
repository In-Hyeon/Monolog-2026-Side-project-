# monolog backend

NestJS + Prisma + PostgreSQL. Firebase Auth로 보호되는 REST API.

## 요구 사항

- Node.js (LTS)
- Docker Desktop (로컬 PostgreSQL 구동용)

## 개발 환경 셋업

### 1. 의존성 설치

```bash
npm install
```

### 2. PostgreSQL 실행

저장소 루트의 `docker-compose.yml`로 `monolog-postgres` 컨테이너를 띄웁니다.

```bash
docker compose up -d
```

### 3. 환경 변수 설정

`.env.example`을 복사해 `.env`를 만들고 값을 채웁니다.

```bash
cp .env.example .env
```

| 변수 | 설명 |
|---|---|
| `DATABASE_URL` | 위 docker-compose 기본값 그대로면 수정 불필요 (`postgresql://user:password@localhost:5432/diary?schema=public`) |
| `PORT` | API 서버 포트 (기본 3001) |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK 서비스 계정 키. 비워두면 앱은 정상 부팅되지만 인증이 필요한 요청은 전부 실패함 (`FirebaseAdminService`가 지연 초기화 방식이라 부팅 자체는 막지 않음) |
| `AI_SERVICE_URL`, `FCM_SERVER_KEY`, `REDIS_URL`, `AWS_*` | 아직 미사용. 자리만 잡아둔 값 |

### 4. Prisma 클라이언트 생성 + 마이그레이션 적용

```bash
npx prisma generate
npx prisma migrate dev
```

### 5. 서버 실행

```bash
npm run start:dev
```

`http://localhost:3001`에서 확인. 인증이 걸린 엔드포인트(`/user`, `/friend`, `/group`, `/diary`, `/qna` 등)는 `Authorization: Bearer <Firebase ID Token>` 헤더 없이 호출하면 401을 반환하는 게 정상입니다.

## 테스트

```bash
npm run test        # 단위 테스트 (Jest)
npm run test:cov     # 커버리지 포함
npm run lint         # eslint --fix
npm run build        # nest build (dist/src/main.js 생성)
```

## 프로젝트 구조

도메인별 모듈로 구성되어 있습니다 (`auth`, `user`, `friend`, `group`, `diary`, `qna`, `chat`, `prisma`). 각 도메인은 Controller → Service → Prisma 3단 구조를 따르고, `FirebaseAuthGuard` + `AppUserGuard`로 보호됩니다.

배경/설계 이력은 저장소 루트 `docs/`를 참고하세요.

- `docs/erd/엔티티 도메인 정리.md` — 데이터 모델
- `docs/decisions/` — 기술적 결정 기록
- `docs/logs/` — 무엇을, 왜 만들었는지에 대한 작업 기록
