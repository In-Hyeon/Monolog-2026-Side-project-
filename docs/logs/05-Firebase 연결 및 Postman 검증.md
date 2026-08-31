# Firebase 연결 및 Postman 검증

- 범위: Firebase 콘솔 설정, `backend/.env`, `frontend/src/lib/firebase.ts`, Postman 컬렉션
- 목표: 실제 Firebase 프로젝트로 인증 토큰을 발급받아 백엔드 API가 끝까지 정상 동작하는지 검증
- 관련 문서: [프로젝트 진행 현황 정리](./04-프로젝트%20진행%20현황%20정리%20(2026-08-28).md)

## 진행 내용

1. **Firebase 프로젝트 생성**(`monolog-2026`) + Authentication 활성화(이메일/비밀번호)
2. **서비스 계정 키 발급** → `backend/.env`에 `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` 반영
3. **웹 앱 등록** → `firebaseConfig`를 `frontend/src/lib/firebase.ts`로 정리(SSR에서 Analytics 호출 시 크래시하는 문제 방지 처리 포함)
4. **서비스 계정 키 원본 JSON**은 저장소 밖(`C:\Users\worlf\secrets\`)으로 격리 — 코드가 JSON 파일이 아닌 `.env` 값을 직접 읽는 구조라 저장소 안에 둘 이유가 없었음
5. **Postman으로 실제 토큰 발급 + API 검증**
   - Firebase REST API(`identitytoolkit.googleapis.com/v1/accounts:signUp`)로 테스트 계정 생성, `idToken`을 Postman 환경 변수에 자동 저장(Post-response 스크립트)
   - `POST /user`(프로필 등록), `GET /user/me`, `POST /group`, `GET /group/mine`, `POST /diary` — 전부 실제 토큰으로 정상 동작 확인

## 문제 및 해결

- **`.env` 형식 오류**: 처음 값을 채울 때 안내 문구의 꺾쇠괄호(`<...>`)를 그대로 남기고, private key를 여러 줄+들여쓰기 상태로 붙여넣어 파싱이 불가능한 상태였음. JSON 원본 그대로 한 줄(`\n` 이스케이프 포함, 큰따옴표로 감싸기)로 다시 채워 해결
- **Docker Desktop 포트 포워딩 오류**: `docker ps`/`docker inspect`상으로는 `5432:5432` 포트 매핑이 정상 설정되어 있었지만, 실제로는 호스트에서 접속 불가(`ECONNREFUSED`) 상태였음. Windows Docker Desktop에서 재시작/절전 복귀 후 종종 발생하는 알려진 이슈. `docker restart monolog-postgres`로 해결(볼륨은 유지되어 데이터 손실 없음)
- 위 두 문제 모두 `POST /user` 호출 시 각각 인증서 파싱 실패, 500(`ECONNREFUSED`)으로 나타났는데, 원인이 다르므로 별도 스크립트로 자격증명 파싱만 분리 검증해 원인을 구분함

## 검증

- Firebase Admin SDK 자격증명 파싱 성공(별도 스크립트로 확인) + 실제 발급된 idToken으로 `verifyIdToken()` 통과
- Postman으로 `user`/`group`/`diary` 도메인 엔드포인트 실제 호출 → 전부 정상 응답(201/200) 확인
