from pydantic import BaseModel, Field
from typing import Optional

class SubjectCreate(BaseModel):
    code: str = Field(..., examples=["CS101"])
    name: str = Field(..., examples=["Nhập môn Lập trình"])
    credits: int = Field(3, ge=0, le=30)
    teacher: Optional[str] = ""
    room: Optional[str] = ""
    schedule: Optional[str] = ""
    semester: Optional[str] = "Học kỳ 1"
    color: Optional[str] = "#3b82f6"

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    credits: Optional[int] = None
    teacher: Optional[str] = None
    room: Optional[str] = None
    schedule: Optional[str] = None
    semester: Optional[str] = None
    color: Optional[str] = None

class GradeUpdate(BaseModel):
    attendance: Optional[float] = Field(None, ge=0, le=10)
    midterm: Optional[float] = Field(None, ge=0, le=10)
    final: Optional[float] = Field(None, ge=0, le=10)
    other: Optional[float] = Field(None, ge=0, le=10)
    weight_attendance: float = Field(0.1, ge=0, le=1)
    weight_midterm: float = Field(0.3, ge=0, le=1)
    weight_final: float = Field(0.6, ge=0, le=1)

def calculate_gpa(total_score: float) -> tuple[float, str]:
    if total_score >= 8.5:
        return 4.0, "A"
    elif total_score >= 8.0:
        return 3.5, "B+"
    elif total_score >= 7.0:
        return 3.0, "B"
    elif total_score >= 6.5:
        return 2.5, "C+"
    elif total_score >= 5.5:
        return 2.0, "C"
    elif total_score >= 5.0:
        return 1.5, "D+"
    elif total_score >= 4.0:
        return 1.0, "D"
    else:
        return 0.0, "F"

def classify_gpa(gpa_4: float) -> str:
    if gpa_4 >= 3.6:
        return "Xuất sắc"
    elif gpa_4 >= 3.2:
        return "Giỏi"
    elif gpa_4 >= 2.5:
        return "Khá"
    elif gpa_4 >= 2.0:
        return "Trung bình"
    else:
        return "Yếu / Cần cố gắng"
