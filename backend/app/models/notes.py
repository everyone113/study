from pydantic import BaseModel, Field
from typing import Optional

class NoteCreate(BaseModel):
    subject_id: Optional[int] = None
    title: str = Field(..., examples=["Ôn thi cuối kỳ"])
    content: Optional[str] = ""
    remind_at: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[str] = "normal"
    tag: Optional[str] = "General"

class NoteUpdate(BaseModel):
    subject_id: Optional[int] = None
    title: Optional[str] = None
    content: Optional[str] = None
    remind_at: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[str] = None
    tag: Optional[str] = None
    is_completed: Optional[int] = None

class DocumentDownloadRequest(BaseModel):
    subject_id: Optional[int] = None
    title: str
    url: str
