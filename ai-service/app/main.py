from fastapi import FastAPI

from app.schemas import (
    CoverImageRequest,
    CoverImageResponse,
    MusicRequest,
    MusicResponse,
    QnaSuggestionRequest,
    QnaSuggestionResponse,
    SummaryRequest,
    SummaryResponse,
    TitleRequest,
    TitleResponse,
)

app = FastAPI(title="Diary AI Service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ai/title", response_model=TitleResponse)
def suggest_title(req: TitleRequest) -> TitleResponse:
    return TitleResponse(title_options=["mock title 1", "mock title 2"])


@app.post("/ai/music", response_model=MusicResponse)
def suggest_music(req: MusicRequest) -> MusicResponse:
    return MusicResponse(mood_tag="calm", track_suggestions=["mock track 1"])


@app.post("/ai/summary", response_model=SummaryResponse)
def summarize(req: SummaryRequest) -> SummaryResponse:
    return SummaryResponse(summary_report="mock summary report")


@app.post("/ai/cover-image", response_model=CoverImageResponse)
def generate_cover_image(req: CoverImageRequest) -> CoverImageResponse:
    return CoverImageResponse(image_url="https://example.com/mock-cover.png")


@app.post("/ai/qna-suggestion", response_model=QnaSuggestionResponse)
def suggest_qna(req: QnaSuggestionRequest) -> QnaSuggestionResponse:
    return QnaSuggestionResponse(question="오늘 하루 중 가장 기억에 남는 순간은 무엇인가요?")
