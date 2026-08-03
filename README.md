# monolog

사진 중심 SNS의 피로감에서 벗어나, 텍스트 중심 기록 + AI 감성 케어 + 세분화된 그룹 공유를 제공하는 감성 소셜 다이어리 서비스. 기획 배경과 상세 스펙은 [`docs/v3`](./docs/v3)를 참고.

- **개인 다이어리(메인 기능)** — 혼자 쓰는 기록이라는 뜻에서 프로젝트명을 `monolog`로 정함
- **그룹 QnA & 채팅(부가 기능)** — 함께 나누는 대화라는 뜻에서 앱 내 노출명은 `Dialog`

## 폴더 구조

```
.
├── docs/          기획 문서 (v1 → v2 → v3, 이슈 해결 히스토리)
├── frontend/      Next.js + TypeScript + TailwindCSS
├── backend/       NestJS + Prisma + PostgreSQL (Core BE)
└── ai-service/    FastAPI (AI 전용 서비스)
```

## 왜 이런 구조인가

**1. 코드와 기획 문서를 한 레포에 함께 둔다 (monorepo).**
문서 따로, 코드 따로 레포를 나누면 "지금 기획이 코드에 반영된 버전인지" 추적이 안 되고 팀원이 문서를 찾아 헤매게 된다. `docs/`를 코드와 같은 레포에 두면 커밋 히스토리 자체가 기획-구현 대응 기록이 되고, 포트폴리오로 볼 때도 기획력과 실행력을 한 번에 보여줄 수 있다.

**2. `frontend` / `backend` / `ai-service`를 서비스 단위로 분리한다.**
[TECH STACK](./docs/v3/다이어리%20웹%20서비스%20기획%20v3.md) 문서에서 정한 대로, 이 프로젝트는 2인 팀이 역할을 나눠 병렬 개발하는 게 핵심 전제다.
- `backend`(NestJS)는 회원/그룹/일기/알림 등 핵심 로직을 담당하며 본인이 FE와 함께 소유한다.
- `ai-service`(FastAPI)는 LLM/이미지 생성 등 AI 로직만 전담하며 팀원이 독립적으로 소유한다.

각 서비스가 독립된 폴더(그리고 독립된 `package.json`/`requirements.txt`, 독립 배포)를 가지면, 팀원이 AI 서비스 코드를 바꾸거나 재배포해도 Core BE 배포에는 영향이 없다. 반대로 본인이 BE 스키마를 바꿔도 팀원의 개발 환경이 깨지지 않는다. 즉 **"누가 어디를 건드려도 서로의 작업을 막지 않는" 것**이 폴더 분리의 목적이다.

**3. 서비스 간 통신은 `docs/v3`에 정의된 REST API 계약(`/ai/title`, `/ai/music`, `/ai/summary`, `/ai/cover-image`, `/ai/qna-suggestion`)을 기준으로 한다.**
`ai-service`는 현재 이 계약대로 목(mock) 응답만 반환하도록 만들어져 있다. Core BE와 FE는 이 목 응답을 상대로 먼저 완성하고, 팀원은 동시에 실제 LLM 연동을 진행하면 된다 — 한쪽이 끝나야 다른 쪽이 시작하는 순차 개발을 피하기 위한 장치다.

## 시작하기

```bash
# frontend
cd frontend && npm run dev          # http://localhost:3000

# backend
cd backend && npm run start:dev     # http://localhost:3001 (DB 연결 전까지는 기본 라우트만 동작)

# ai-service
cd ai-service
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

각 서비스 폴더의 `.env.example`을 `.env`로 복사한 뒤 값을 채워 넣는다.
