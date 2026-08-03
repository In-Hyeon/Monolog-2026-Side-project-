# AI Service

Core BE(`/backend`)가 호출하는 내부 API를 제공하는 별도 서비스. 현재는 `docs/v3` TECH STACK 섹션의 API 계약대로 목(mock) 응답만 반환하며, 실제 LLM/이미지 생성/음악 추천 로직으로 채워나가면 된다.

## 실행

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 엔드포인트

| Method | Path | 설명 |
|---|---|---|
| POST | /ai/title | 일기 본문 → 제목 후보 |
| POST | /ai/music | 일기 본문 → 감정 태그 + 음악 추천 |
| POST | /ai/summary | 일기 목록 → 요약 리포트 |
| POST | /ai/cover-image | 일기 본문 → 커버 이미지 URL |
| POST | /ai/qna-suggestion | 시간대 → QnA 질문 |

`.env.example`을 `.env`로 복사해 실제 API 키를 채우면 된다.
