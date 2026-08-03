from pydantic import BaseModel


class TitleRequest(BaseModel):
    diary_text: str


class TitleResponse(BaseModel):
    title_options: list[str]


class MusicRequest(BaseModel):
    diary_text: str


class MusicResponse(BaseModel):
    mood_tag: str
    track_suggestions: list[str]


class SummaryRequest(BaseModel):
    entries: list[str]


class SummaryResponse(BaseModel):
    summary_report: str


class CoverImageRequest(BaseModel):
    diary_text: str


class CoverImageResponse(BaseModel):
    image_url: str


class QnaSuggestionRequest(BaseModel):
    time_of_day: str


class QnaSuggestionResponse(BaseModel):
    question: str
