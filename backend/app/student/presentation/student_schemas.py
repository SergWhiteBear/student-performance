from pydantic import BaseModel

class StudentCreate(BaseModel):
    full_name: str
    math_score: int
    russian_score: int
    ege_score: int
    session_1_passed: bool = False
    session_2_passed: bool = False
    session_3_passed: bool = False
    session_4_passed: bool = False
    direction_id: int

class StudentUpdate(BaseModel):
    full_name: str | None = None
    math_score: int | None = None
    russian_score: int | None = None
    ege_score: int | None = None
    session_1_passed: bool | None = None
    session_2_passed: bool | None = None
    session_3_passed: bool | None = None
    session_4_passed: bool | None = None
    direction_id: int | None = None

class StudentFilter(StudentUpdate):
    id: int | None = None

    class Config:
        from_attributes = True

class StudentFilterByDirection(BaseModel):
    direction_id: int | None = None

    class Config:
        from_attributes = True

