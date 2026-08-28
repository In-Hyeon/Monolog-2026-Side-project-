# Friend 테이블 방향성 분리 (FriendRequest, Friendship)

- 범위: `backend/` (Prisma 스키마, `friend` 모듈), `docs/erd/`
- 목표: 친구 요청(방향성 있음)과 성사된 친구 관계(대칭)를 하나의 `Friend` 테이블에 `status` 컬럼으로 뭉쳐뒀던 걸 두 테이블로 분리
- 관련 문서: [백엔드 초기 구축 (Task 1~6)](./01-백엔드%20초기%20구축%20(Task%201~6).md), [도메인 모듈 확장](./02-도메인%20모듈%20확장%20(friend,%20group,%20diary,%20qna).md)

## 배경

기존 `Friend` 모델은 `requesterId`/`addresseeId`/`status`(`pending`/`accepted`) 하나로 요청 단계와 성사된 관계를 동시에 표현했다. 이 구조에서 "특정 유저의 친구 목록"을 조회하려면 매번 `OR: [{requesterId}, {addresseeId}]`로 양방향을 다 확인하고, 결과에서도 "내가 requester였는지 addressee였는지"에 따라 상대방 필드를 분기해서 꺼내야 했다 (`row.requesterId === userId ? row.addressee : row.requester`).

친구 요청 자체는 방향성이 꼭 필요하지만(누가 보냈는지 구분해야 수락/거절 권한을 검증할 수 있음), 일단 수락된 이후의 "친구 관계"는 완전히 대칭적이라 방향성이 조회 로직에 불필요한 복잡도만 더하고 있었다.

## 결론

`Friend`를 두 테이블로 분리했다.

- **`FriendRequest`**: `requesterId`, `addresseeId`, `createdAt`만 가짐. `status` 컬럼 제거 — row가 존재하면 항상 "대기 중"이라는 뜻이라 별도 상태값이 정보를 추가하지 않기 때문. 수락되면 row 삭제(관계는 `Friendship`으로 이관), 거절되어도 row 삭제.
- **`Friendship`**: `userId`, `friendId`, `createdAt`. 수락 시 `(A, B)`와 `(B, A)` 두 row를 트랜잭션으로 동시 생성하는 대칭(비정규화) 구조. 대신 조회는 `WHERE userId = :userId` 한 줄로 끝난다.

트레이드오프: **쓰기 시점(수락/언프렌드)의 복잡도를 감수하고 읽기 시점(친구 목록 조회, 훨씬 자주 발생)을 단순화**하는 선택.

## 진행 순서

1. ERD 툴(drawDB)에서 `Friend`를 두 테이블로 나눠 재설계 → `docs/erd/Monolog_s3.sql`로 export
2. `docs/erd/엔티티 도메인 정리.md` 갱신 (필드 테이블, FK 요약표, 도메인 다이어그램)
3. `backend/prisma/schema.prisma`에 `FriendRequest`/`Friendship` 모델 반영
4. `friend.service.ts` 전체 재작성 — `acceptRequest`에서 `$transaction([...])`으로 `Friendship` 2-row 생성 + `FriendRequest` 삭제를 원자적으로 처리, `unfriend`는 `deleteMany`로 양방향 row 동시 삭제
5. `friend.service.spec.ts` 재작성 (`friend.controller.spec.ts`는 서비스를 완전히 mock해서 변경 불필요했음)
6. `npx prisma migrate dev`로 마이그레이션 생성/적용 (`Friend` 테이블 drop, 신규 테이블 2개 생성)

## 검증

- `prisma generate`, `nest build`, `eslint --fix`, `jest`(16 스위트 / 98 테스트) 전부 통과
- 실제 Postgres에 마이그레이션 적용 후 부팅 테스트: 24개 라우트 정상 매핑, `/friend`·`/friend/requests`·`/group/mine` 등 인증 필요 엔드포인트가 토큰 없이 호출 시 전부 401로 차단됨을 curl로 확인

## 참고

- ERD 원본 export(`Monolog_s1.sql`, `Monolog_s2.sql`)는 이 분리 이전 시점 그대로 두고 손대지 않음 — `Monolog_s3.sql`이 분리 이후 최신 버전
