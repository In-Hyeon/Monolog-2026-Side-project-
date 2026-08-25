CREATE TABLE IF NOT EXISTS "User" (
	--  DB 내부 식별자
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	-- Firebase Auth가 발급한 UID, 로그인 세션 매칭용
	"firebaseUid" VARCHAR(128) NOT NULL UNIQUE,
	-- 로그인 계정 이메일(Google/Kakao)
	"email" VARCHAR(255) NOT NULL UNIQUE,
	-- 화면에 표시되는 닉네임
	"name" VARCHAR(50) NOT NULL,
	-- 프로필 사진 URL, 없으면 기본 아바타
	"profileImage" VARCHAR(2048),
	-- 가입 시각
	"createdAt" TIMESTAMP NOT NULL DEFAULT now(),
	-- 프로필 정보 최종 수정 시각
	"updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
	PRIMARY KEY("id")
);


COMMENT ON COLUMN "User"."id" IS ' DB 내부 식별자';
COMMENT ON COLUMN "User"."firebaseUid" IS 'Firebase Auth가 발급한 UID, 로그인 세션 매칭용';
COMMENT ON COLUMN "User"."email" IS '로그인 계정 이메일(Google/Kakao)';
COMMENT ON COLUMN "User"."name" IS '화면에 표시되는 닉네임';
COMMENT ON COLUMN "User"."profileImage" IS '프로필 사진 URL, 없으면 기본 아바타';
COMMENT ON COLUMN "User"."createdAt" IS '가입 시각';
COMMENT ON COLUMN "User"."updatedAt" IS '프로필 정보 최종 수정 시각';


CREATE TABLE IF NOT EXISTS "NotificationSetting" (
	-- 설정 레코드 식별자
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	-- 설정 대상 사용자
	"userId" UUID NOT NULL,
	-- 값: personalPrompt / groupQna / groupChat
	"category" VARCHAR(20) NOT NULL,
	-- 해당 카테고리 알림 수신 여부
	"enabled" BOOLEAN NOT NULL DEFAULT true,
	PRIMARY KEY("id"),
	CONSTRAINT "NotificationSetting_unique_0" UNIQUE ("userId", "category")
);


COMMENT ON COLUMN "NotificationSetting"."id" IS '설정 레코드 식별자';
COMMENT ON COLUMN "NotificationSetting"."userId" IS '설정 대상 사용자';
COMMENT ON COLUMN "NotificationSetting"."category" IS '값: personalPrompt / groupQna / groupChat';
COMMENT ON COLUMN "NotificationSetting"."enabled" IS '해당 카테고리 알림 수신 여부';


CREATE TABLE IF NOT EXISTS "Friend" (
	-- 친구 관계 식별자
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	-- 요청 보낸 사용자
	"requesterId" UUID NOT NULL,
	-- 요청 받은 사용자
	"addresseeId" UUID NOT NULL,
	-- 값: pending(대기) / accepted(수락)
	"status" VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK("requesterId" <> "addresseeId"),
	-- 요청 생성 시각
	"createdAt" TIMESTAMP NOT NULL DEFAULT now(),
	PRIMARY KEY("id"),
	CONSTRAINT "Friend_unique_0" UNIQUE ("requesterId", "addresseeId")
);


COMMENT ON COLUMN "Friend"."id" IS '친구 관계 식별자';
COMMENT ON COLUMN "Friend"."requesterId" IS '요청 보낸 사용자';
COMMENT ON COLUMN "Friend"."addresseeId" IS '요청 받은 사용자';
COMMENT ON COLUMN "Friend"."status" IS '값: pending(대기) / accepted(수락)';
COMMENT ON COLUMN "Friend"."createdAt" IS '요청 생성 시각';


CREATE TABLE IF NOT EXISTS "Groups" (
	-- 그룹 식별자
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	-- 그룹 이름
	"name" VARCHAR(100) NOT NULL,
	-- 그룹장
	"ownerId" UUID NOT NULL,
	-- 참여용 초대 코드, 재발급 시 값 갱신
	"inviteCode" VARCHAR(20) NOT NULL UNIQUE,
	-- 현재 코드 발급 시각
	"codeIssuedAt" TIMESTAMP NOT NULL DEFAULT now(),
	-- 이 시각 이후 코드 자동 무효화(조회 시점 검증)
	"codeExpiresAt" TIMESTAMP NOT NULL,
	-- 그룹 생성 시각
	"createdAt" TIMESTAMP NOT NULL DEFAULT now(),
	PRIMARY KEY("id")
);


COMMENT ON COLUMN "Groups"."id" IS '그룹 식별자';
COMMENT ON COLUMN "Groups"."name" IS '그룹 이름';
COMMENT ON COLUMN "Groups"."ownerId" IS '그룹장';
COMMENT ON COLUMN "Groups"."inviteCode" IS '참여용 초대 코드, 재발급 시 값 갱신';
COMMENT ON COLUMN "Groups"."codeIssuedAt" IS '현재 코드 발급 시각';
COMMENT ON COLUMN "Groups"."codeExpiresAt" IS '이 시각 이후 코드 자동 무효화(조회 시점 검증)';
COMMENT ON COLUMN "Groups"."createdAt" IS '그룹 생성 시각';


CREATE TABLE IF NOT EXISTS "GroupMember" (
	-- 매핑 레코드 식별자
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	-- 소속 그룹
	"groupId" UUID NOT NULL,
	-- 멤버 아이디
	"userId" UUID NOT NULL,
	-- 값: owner(그룹장) / member(일반 멤버)
	"role" VARCHAR(10) NOT NULL DEFAULT 'member',
	-- 가입 시각
	"joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
	PRIMARY KEY("id"),
	CONSTRAINT "GroupMember_unique_0" UNIQUE ("groupId", "userId")
);


COMMENT ON COLUMN "GroupMember"."id" IS '매핑 레코드 식별자';
COMMENT ON COLUMN "GroupMember"."groupId" IS '소속 그룹';
COMMENT ON COLUMN "GroupMember"."userId" IS '멤버 아이디';
COMMENT ON COLUMN "GroupMember"."role" IS '값: owner(그룹장) / member(일반 멤버)';
COMMENT ON COLUMN "GroupMember"."joinedAt" IS '가입 시각';


CREATE TABLE IF NOT EXISTS "Diary" (
	-- 일기 식별자
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	-- 이 일기를 작성한 작성자
	"authorId" UUID NOT NULL,
	-- 값: quick(원라인) / full(정식 작성)
	"entryType" VARCHAR(10) NOT NULL DEFAULT 'quick',
	-- 일기 본문
	"content" TEXT NOT NULL,
	-- 원라인 모드 이모지, full 작성 시 비워도 됨
	"emoji" VARCHAR(16),
	-- private(나만보기) / public(전체공유) / group(그룹선택)
	"privacyScope" VARCHAR(10) NOT NULL DEFAULT 'private',
	-- 질문 프롬프트로 작성 시 연결, 자유 작성이면 NULL
	"promptId" UUID DEFAULT NULL,
	-- 최초 작성 시각
	"createdAt" TIMESTAMP NOT NULL DEFAULT now(),
	-- "이어쓰기"로 수정 시 갱신 시각
	"updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
	PRIMARY KEY("id")
);


COMMENT ON COLUMN "Diary"."id" IS '일기 식별자';
COMMENT ON COLUMN "Diary"."authorId" IS '이 일기를 작성한 작성자';
COMMENT ON COLUMN "Diary"."entryType" IS '값: quick(원라인) / full(정식 작성)';
COMMENT ON COLUMN "Diary"."content" IS '일기 본문';
COMMENT ON COLUMN "Diary"."emoji" IS '원라인 모드 이모지, full 작성 시 비워도 됨';
COMMENT ON COLUMN "Diary"."privacyScope" IS 'private(나만보기) / public(전체공유) / group(그룹선택)';
COMMENT ON COLUMN "Diary"."promptId" IS '질문 프롬프트로 작성 시 연결, 자유 작성이면 NULL';
COMMENT ON COLUMN "Diary"."createdAt" IS '최초 작성 시각';
COMMENT ON COLUMN "Diary"."updatedAt" IS '"이어쓰기"로 수정 시 갱신 시각';


CREATE TABLE IF NOT EXISTS "DailyPrompt" (
	-- 질문 식별자
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	-- 매일 발송되는 질문 문구
	"questionText" VARCHAR(255) NOT NULL,
	-- 요일/계절 로테이션 태그(예: mon, summer)
	"rotationKey" VARCHAR(20) DEFAULT NULL,
	-- 질문 뱅크 등록 시각
	"createdAt" TIMESTAMP NOT NULL DEFAULT now(),
	PRIMARY KEY("id")
);


COMMENT ON COLUMN "DailyPrompt"."id" IS '질문 식별자';
COMMENT ON COLUMN "DailyPrompt"."questionText" IS '매일 발송되는 질문 문구';
COMMENT ON COLUMN "DailyPrompt"."rotationKey" IS '요일/계절 로테이션 태그(예: mon, summer)';
COMMENT ON COLUMN "DailyPrompt"."createdAt" IS '질문 뱅크 등록 시각';


CREATE TABLE IF NOT EXISTS "DiaryGroupShare" (
	-- 매핑 레코드 식별자
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	-- 공유되는 일기
	"diaryId" UUID NOT NULL,
	-- 공유 대상 그룹
	"groupId" UUID NOT NULL,
	-- 공유 설정 시각
	"createdAt" TIMESTAMP NOT NULL DEFAULT now(),
	PRIMARY KEY("id"),
	CONSTRAINT "DiaryGroupShare_unique_0" UNIQUE ("diaryId", "groupId")
);


COMMENT ON COLUMN "DiaryGroupShare"."id" IS '매핑 레코드 식별자';
COMMENT ON COLUMN "DiaryGroupShare"."diaryId" IS '공유되는 일기';
COMMENT ON COLUMN "DiaryGroupShare"."groupId" IS '공유 대상 그룹';
COMMENT ON COLUMN "DiaryGroupShare"."createdAt" IS '공유 설정 시각';


CREATE TABLE IF NOT EXISTS "GroupQuestion" (
	-- 질문 식별자
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	-- 어느 그룹의 QnA인지
	"groupId" UUID NOT NULL,
	-- 질문을 등록한 멤버
	"authorId" UUID NOT NULL,
	-- 질문 본문. 멤버가 자율 작성하는 텍스트라 DailyPrompt.questionText(고정 뱅크)와 달리 길이 제한 없이 TEXT
	"questionText" TEXT NOT NULL,
	-- 질문에 첨부한 사진 URL
	"photoUrl" VARCHAR(2048) DEFAULT NULL,
	-- 이 시각 이후 소프트 삭제 대상
	"expiresAt" TIMESTAMP NOT NULL,
	-- 48시간 경과 후 소프트 삭제 플래그
	"isDeleted" BOOLEAN NOT NULL DEFAULT false,
	-- 질문 등록 시간
	"createdAt" TIMESTAMP NOT NULL DEFAULT now(),
	PRIMARY KEY("id")
);


COMMENT ON COLUMN "GroupQuestion"."id" IS '질문 식별자';
COMMENT ON COLUMN "GroupQuestion"."groupId" IS '어느 그룹의 QnA인지';
COMMENT ON COLUMN "GroupQuestion"."authorId" IS '질문을 등록한 멤버';
COMMENT ON COLUMN "GroupQuestion"."questionText" IS '질문 본문. 멤버가 자율 작성하는 텍스트라 DailyPrompt.questionText(고정 뱅크)와 달리 길이 제한 없이 TEXT';
COMMENT ON COLUMN "GroupQuestion"."photoUrl" IS '질문에 첨부한 사진 URL';
COMMENT ON COLUMN "GroupQuestion"."expiresAt" IS '이 시각 이후 소프트 삭제 대상';
COMMENT ON COLUMN "GroupQuestion"."isDeleted" IS '48시간 경과 후 소프트 삭제 플래그';
COMMENT ON COLUMN "GroupQuestion"."createdAt" IS '질문 등록 시간';


CREATE TABLE IF NOT EXISTS "GroupAnswer" (
	-- 답변 식별자
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	-- 어느 질문에 대한 답변인지
	"questionId" UUID NOT NULL,
	-- 답변자가 누구인지
	"authorId" UUID NOT NULL,
	-- 답변한 내용 본문
	"answerText" TEXT NOT NULL,
	-- 답변에 첨부한 사진 URL
	"photoUrl" VARCHAR(2048) DEFAULT NULL,
	-- 답변 작성 시간
	"createdAt" TIMESTAMP NOT NULL DEFAULT now(),
	PRIMARY KEY("id")
);


COMMENT ON COLUMN "GroupAnswer"."id" IS '답변 식별자';
COMMENT ON COLUMN "GroupAnswer"."questionId" IS '어느 질문에 대한 답변인지';
COMMENT ON COLUMN "GroupAnswer"."authorId" IS '답변자가 누구인지';
COMMENT ON COLUMN "GroupAnswer"."answerText" IS '답변한 내용 본문';
COMMENT ON COLUMN "GroupAnswer"."photoUrl" IS '답변에 첨부한 사진 URL';
COMMENT ON COLUMN "GroupAnswer"."createdAt" IS '답변 작성 시간';


CREATE TABLE IF NOT EXISTS "QuestionBookmark" (
	-- 저장 레코드 식별자
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	-- 저장한 사용자
	"userId" UUID NOT NULL,
	-- 저장 대상 질문
	"questionId" UUID NOT NULL,
	-- 저장한 시각
	"createdAt" TIMESTAMP NOT NULL DEFAULT now(),
	PRIMARY KEY("id"),
	CONSTRAINT "QuestionBookmark_unique_0" UNIQUE ("userId", "questionId")
);


COMMENT ON COLUMN "QuestionBookmark"."id" IS '저장 레코드 식별자';
COMMENT ON COLUMN "QuestionBookmark"."userId" IS '저장한 사용자';
COMMENT ON COLUMN "QuestionBookmark"."questionId" IS '저장 대상 질문';
COMMENT ON COLUMN "QuestionBookmark"."createdAt" IS '저장한 시각';


CREATE TABLE IF NOT EXISTS "AnswerBookmark" (
	-- 저장 레코드 식별자
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	-- 저장한 사용자
	"userId" UUID NOT NULL,
	-- 저장 대상자의 답변
	"answerId" UUID NOT NULL,
	-- 저장한 시각
	"createdAt" TIMESTAMP NOT NULL DEFAULT now(),
	PRIMARY KEY("id"),
	CONSTRAINT "AnswerBookmark_unique_0" UNIQUE ("userId", "answerId")
);


COMMENT ON COLUMN "AnswerBookmark"."id" IS '저장 레코드 식별자';
COMMENT ON COLUMN "AnswerBookmark"."userId" IS '저장한 사용자';
COMMENT ON COLUMN "AnswerBookmark"."answerId" IS '저장 대상자의 답변';
COMMENT ON COLUMN "AnswerBookmark"."createdAt" IS '저장한 시각';


CREATE TABLE IF NOT EXISTS "ChatMessage" (
	-- 메시지 식별자
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	-- 어느 그룹 채팅방인지(별도 ChatRoom 테이블 없이 Groups가 채팅방 역할을 겸함)
	"groupId" UUID NOT NULL,
	-- 발신자
	"authorId" UUID NOT NULL,
	-- 메시지 본문
	"content" TEXT NOT NULL,
	-- 전송 시각
	"createdAt" TIMESTAMP NOT NULL DEFAULT now(),
	PRIMARY KEY("id")
);


COMMENT ON COLUMN "ChatMessage"."id" IS '메시지 식별자';
COMMENT ON COLUMN "ChatMessage"."groupId" IS '어느 그룹 채팅방인지(별도 ChatRoom 테이블 없이 Groups가 채팅방 역할을 겸함)';
COMMENT ON COLUMN "ChatMessage"."authorId" IS '발신자';
COMMENT ON COLUMN "ChatMessage"."content" IS '메시지 본문';
COMMENT ON COLUMN "ChatMessage"."createdAt" IS '전송 시각';

ALTER TABLE "Diary"
ADD FOREIGN KEY("authorId") REFERENCES "User"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "Friend"
ADD FOREIGN KEY("requesterId") REFERENCES "User"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "Friend"
ADD FOREIGN KEY("addresseeId") REFERENCES "User"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "Groups"
ADD FOREIGN KEY("ownerId") REFERENCES "User"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "GroupMember"
ADD FOREIGN KEY("groupId") REFERENCES "Groups"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "GroupMember"
ADD FOREIGN KEY("userId") REFERENCES "User"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "DiaryGroupShare"
ADD FOREIGN KEY("diaryId") REFERENCES "Diary"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "DiaryGroupShare"
ADD FOREIGN KEY("groupId") REFERENCES "Groups"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "NotificationSetting"
ADD FOREIGN KEY("userId") REFERENCES "User"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "Diary"
ADD FOREIGN KEY("promptId") REFERENCES "DailyPrompt"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "GroupQuestion"
ADD FOREIGN KEY("groupId") REFERENCES "Groups"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "GroupQuestion"
ADD FOREIGN KEY("authorId") REFERENCES "User"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "GroupAnswer"
ADD FOREIGN KEY("questionId") REFERENCES "GroupQuestion"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "GroupAnswer"
ADD FOREIGN KEY("authorId") REFERENCES "User"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "QuestionBookmark"
ADD FOREIGN KEY("userId") REFERENCES "User"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "QuestionBookmark"
ADD FOREIGN KEY("questionId") REFERENCES "GroupQuestion"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "AnswerBookmark"
ADD FOREIGN KEY("userId") REFERENCES "User"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "AnswerBookmark"
ADD FOREIGN KEY("answerId") REFERENCES "GroupAnswer"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "ChatMessage"
ADD FOREIGN KEY("groupId") REFERENCES "Groups"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "ChatMessage"
ADD FOREIGN KEY("authorId") REFERENCES "User"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;