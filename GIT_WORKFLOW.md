# Git 협업 가이드

이 프로젝트에서 브랜치를 만들고, 커밋하고, PR을 올리는 방법을 정리한 문서. 팀원과 함께 이 규칙을 따른다.

## 1. 브랜치 전략

`main`은 항상 배포 가능한 상태로 유지하고, 직접 push하지 않는다. 모든 작업은 브랜치를 파서 진행한 뒤 PR로 합친다.

브랜치는 **사람별이 아니라 기능/작업 단위**로 나눈다. 사람별 브랜치(`inhyeon`, `teammate`)는 오래 살아남고 합칠 때 충돌이 커지므로 지양한다.

### 브랜치 이름 규칙

| 접두사 | 용도 | 예시 |
|---|---|---|
| `feature/` | 새 기능 | `feature/diary-crud` |
| `fix/` | 버그 수정 | `fix/login-redirect` |
| `chore/` | 설정, 의존성, 문서 등 | `chore/update-gitignore` |

### 지금 프로젝트의 개발 순서 (`docs/v3` 로드맵 기준)

1단계 MVP는 회원가입 → 일기 CRUD → 그룹 인프라 → 프라이버시 설정 → 알림 설정 순으로 의존성이 있다. 인증이 없으면 나머지를 테스트할 수 없으므로 `feature/auth`부터 시작하고, 이후 나머지 기능 브랜치를 병렬로 진행한다.

## 2. 브랜치 생성 및 작업 흐름

```bash
# 1. main 최신화
git checkout main
git pull

# 2. 새 브랜치 생성 + 이동
git checkout -b feature/작업이름

# 3. 작업 후 커밋
git add .
git commit -m "작업 내용 요약"

# 4. 원격에 push (최초 1회는 -u로 upstream 연결)
git push -u origin feature/작업이름
# 이후로는 git push 만 치면 됨
```

push하면 GitHub 저장소 페이지에 "Compare & pull request" 버튼이 자동으로 뜬다. 이걸 눌러 PR을 생성한다.

## 3. PR과 머지

- PR을 올리면 팀원이 리뷰 후 승인(Approve)한다.
- 승인이 되면 **Merge pull request** 클릭 → 머지 완료 후 브랜치는 삭제한다.
- 머지된 `main`을 로컬에 반영: `git checkout main && git pull`

## 4. Branch Protection Rule (GitHub 저장소 설정)

`main`에 직접 push하는 걸 막기 위해 저장소 **Settings → Branches → Add branch protection rule**에서 설정한다.

- Branch name pattern: `main`
- ✅ **Require a pull request before merging** — PR 없이 `main`에 직접 push 금지
- ✅ **Require approvals** (1개) — 팀원 승인 없이는 머지 불가
- ⬜ **Do not allow bypassing the above settings** — 이건 **꺼둔다.** 꺼두면 저장소 Admin(본인)은 팀원이 확인 못 하는 급한 상황에서 승인 없이 강제 머지(Merge without waiting for requirements)할 수 있다. 평소엔 정상적으로 승인받고, 막힐 때만 예외적으로 쓰는 안전판이다.

## 5. 원격 저장소 연결 & 인증

### 최초 연결

```bash
git remote add origin https://github.com/<계정명>/monolog.git
git remote -v   # fetch/push 두 줄 뜨면 연결 확인 완료
```

### 인증

Windows용 Git에는 Git Credential Manager(GCM)가 내장돼 있어서 별도 설정 없이 동작한다. 최초 `git push` 시 브라우저 창이 자동으로 뜨고, GitHub 로그인 후 Authorize 하면 인증 정보가 로컬에 저장돼 이후로는 다시 로그인할 필요가 없다.

브라우저 인증이 안 될 경우에만 Personal Access Token(PAT)을 대안으로 쓴다: GitHub → Settings → Developer settings → Personal access tokens에서 발급 후, push 시 비밀번호 자리에 입력.

### 팀원 초대

저장소 **Settings → Collaborators → Add people**에서 팀원의 GitHub 아이디/이메일로 초대한다. 팀원은 수락 후 아래 명령으로 클론한다.

```bash
git clone https://github.com/<계정명>/monolog.git
```

## 6. 자주 쓰는 명령 정리

```bash
git status                  # 변경/스테이징 상태 확인
git branch                  # 로컬 브랜치 목록 (현재 위치는 * 표시)
git branch --show-current   # 현재 브랜치 이름만 확인
git checkout main           # main으로 이동 (커밋 안 한 변경사항 있으면 먼저 commit/stash)
git pull                    # 원격의 최신 변경사항 받아오기
```
