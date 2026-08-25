# 도메인 모듈 확장 (friend, group, diary, qna)

- 범위: `backend/` (NestJS + Prisma)
- 목표: Task #6에서 세운 `user` 모듈 패턴(Controller → Service → Prisma, `FirebaseAuthGuard` 보호)을 나머지 4개 도메인으로 확장
- 관련 문서: [백엔드 초기 구축 (Task 1~6)](./01-백엔드%20초기%20구축%20(Task%201~6).md)

## 공통 인프라 추가: AppUserGuard / @CurrentAppUser()

기존 `user` 모듈은 `FirebaseAuthGuard`가 채운 `request.user`(Firebase의 `DecodedIdToken`)만으로 충분했지만, 나머지 도메인은 대부분 내부 `User.id`(FK)가 필요하다. 컨트롤러마다 `firebaseUid`로 `User`를 조회하는 코드를 반복하는 대신, 가드 체인에 `AppUserGuard`를 추가해 `request.appUser`에 내부 `User` 레코드를 채우도록 했다.

```ts
@UseGuards(FirebaseAuthGuard, AppUserGuard)
```

- **산출물**: `AppUserGuard`(`src/auth/guards/app-user.guard.ts`), `@CurrentAppUser()` 데코레이터, `Express.Request.appUser` 타입 확장
- **왜 커스텀 파라미터 데코레이터에서 직접 조회하지 않았나**: NestJS 가드는 비동기 처리가 공식 문서에 명시되어 있지만, 커스텀 파라미터 데코레이터의 비동기 동작은 보장 문서가 불명확함 → 가드 단계에서 조회를 끝내고 데코레이터는 동기적으로 값만 꺼내는 구조를 선택
- **예외**: `UserController`는 `AppUserGuard`를 쓰지 않음 — `POST /user`가 아직 `User` 로우가 없는 최초 가입자를 위한 엔드포인트라, `AppUserGuard`를 걸면 첫 로그인 자체가 막히기 때문

## 모듈별 산출물

### friend
`SendFriendRequestDto`, 요청 보내기/수락/거절, 받은/보낸 요청 목록, 친구 목록, 삭제(unfriend). `Friend` 모델의 `@@unique([requesterId, addresseeId])`가 방향성을 가지므로 중복/관계 조회는 `OR`로 양방향 모두 확인.

### group
`CreateGroupDto`, `JoinGroupDto`. 그룹 생성 시 `Group` + owner `GroupMember`를 트랜잭션으로 함께 생성, 초대코드는 `randomBytes(6).toString('hex')`(TTL 7일). `isMember(groupId, userId)`를 `GroupService`에서 export해 diary/qna 모듈이 재사용(`GroupModule.imports`).

### diary
`CreateDiaryDto`(entryType, privacyScope, groupIds 등), `UpdateDiaryDto`. `privacyScope`(private/public/group)에 따라 조회 권한 분기, 그룹 공유는 `Diary` + `DiaryGroupShare`를 트랜잭션으로 생성. 삭제 시 `DiaryGroupShare`를 먼저 지운 뒤 `Diary` 삭제(스키마에 cascade 미정의). `GET /diary/prompt/today`는 가장 최근 생성된 `DailyPrompt` 하나를 반환하는 단순 구현.

### qna
`GroupQuestion`/`GroupAnswer`/`QuestionBookmark`/`AnswerBookmark` 담당. 질문은 48시간 TTL 후 소프트 삭제(`isDeleted` 플래그, 하드 삭제 아님). 북마크는 `upsert`(북마크)/`deleteMany`(해제)로 멱등하게 구현.

## 검증
- `nest build`, `eslint --fix` 클린
- Jest 16 스위트 / 97 테스트 전부 통과
- 실제 부팅 후 24개 라우트 정상 매핑 확인, 인증 없이 호출 시 전부 401로 차단됨을 curl로 확인

## 이번 범위에서 의도적으로 제외한 것
- 그룹 삭제 API (cascade 미정의로 FK 위반 위험)
- 초대코드 재발급/갱신 API
- "내가 북마크한 질문/답변" 목록 조회 API
- `UpdateDiaryDto`로 `privacyScope`를 `'group'`으로 변경 (그룹 공유 변경은 별도 엔드포인트 필요)
