# 모듈 시스템 (CommonJS vs ESM) 결정

- 작성일: 2026-08-15
- 범위: `backend/` (NestJS + Prisma)
- 상태: 확정 (재검토 조건 있음, 하단 참고)

## 배경

Task #4(Nest 모듈 스캐폴딩) 진행 중, `schema.prisma`의 Prisma 7 신규 클라이언트 생성기(`provider = "prisma-client"`)가 내부적으로 `import.meta.url`(ESM 전용 문법)을 사용해 CommonJS 기반인 현재 백엔드와 충돌했다. 이 문제를 계기로 프로젝트 전체를 ESM으로 전환할지 여부를 논의했다.

## 결론

**당분간 CommonJS를 유지한다.** Prisma는 구버전 생성기(`provider = "prisma-client-js"`)로 우회해 CommonJS와 호환시켰다.

```prisma
generator client {
  provider = "prisma-client-js"
}
```

## 검토 과정 요약

### 1. CommonJS의 구조적 단점
- 동기적 `require()` → 정적 분석 불가 → 트리 셰이킹 안 됨
- 브라우저 네이티브 미지원 (번들러 필요)
- 순환 의존성 처리가 ESM의 live binding보다 불안정
- top-level await 불가 (`main.ts`의 `bootstrap()` 래퍼가 이 때문에 필요)
- 신규 npm 패키지들이 점점 ESM 전용으로 전환하는 추세 (예: node-fetch, chalk, execa)

### 2. 지금 당장 ESM으로 전환하지 않은 이유
- NestJS가 아직 ESM을 1급 시민으로 지원하지 않음 (v11 기준, 공식 스타터/생태계가 CJS 중심)
- ESM 전환 시 모든 상대경로 import에 `.js` 확장자 강제 → 기존 8개 모듈 전체 수정 필요
- Jest + ts-jest의 ESM 지원이 아직 experimental — 14개 spec 테스트 전체를 다시 검증해야 함
- 전환으로 얻는 실익이 작음: Prisma 최신 생성기든 구버전이든 결국 `@prisma/adapter-pg` 드라이버 어댑터가 똑같이 필요해서, 기능 차이가 거의 없음

### 3. NestJS v12 로드맵 확인 (2026-08-15 조사)
NestJS v12.0.0이 "approx Q3 2026" 목표로 draft PR([nestjs/nest#16391](https://github.com/nestjs/nest/pull/16391))에 올라와 있음. 주요 내용:
- 전 공식 패키지 CommonJS → ESM 전환
- 테스트 러너 Jest → Vitest, 린터 ESLint → oxlint, 번들러 Webpack → Rspack 교체
- **단, Node.js의 `require(esm)` 지원 덕분에 v12 패키지 자체가 ESM이어도 CJS 프로젝트에서 큰 마찰 없이 계속 사용 가능**
- Nest CLI가 v12에서도 CJS 템플릿(Jest 유지)과 ESM 템플릿(Vitest 기본)을 둘 다 제공 예정
- 그 외 breaking change는 "minor" 수준으로 평가됨 (NATS v3, Standard Schema 지원 등)

즉 **v12로의 버전업 자체와 ESM 전환은 분리된 선택지**다. v12가 나와도 즉시 ESM으로 갈아탈 필요는 없다.

## 최종 방침

| 시점 | 방침 |
|---|---|
| 지금 (v11) | CommonJS + `prisma-client-js` 유지 |
| v12 출시 시 | 일단 버전만 올리고 CJS + Jest 템플릿 유지 (마찰 적을 것으로 예상) |
| ESM 전환 | v12 안정화 이후 별도로 여유 있게 재검토. 전환 시 Prisma도 `"prisma-client"`(최신 생성기)로 함께 전환 |

## 재검토 조건
- NestJS v12 정식 출시 및 공식 v11→v12 마이그레이션 가이드 공개 시
- ESM 전용 패키지가 프로젝트에 꼭 필요해졌을 때
- Vitest 기반 ESM 템플릿이 충분히 검증됐다고 판단될 때

## 참고 자료
- [NestJS v12 Roadmap — InfoQ](https://www.infoq.com/news/2026/04/nestjs-12-roadmap-esm/)
- [release: v12.0.0 major release (approx. Q3 2026) — GitHub PR #16391](https://github.com/nestjs/nest/pull/16391)
- [NestJS v12 Preview: ESM, Vitest, and the End of class-validator — byteiota](https://byteiota.com/nestjs-v12-preview-esm-vitest-and-the-end-of-class-validator/)
- [NestJS v12 is Coming: What's New — Trilon Consulting](https://trilon.io/blog/nestjs-12-is-coming)
