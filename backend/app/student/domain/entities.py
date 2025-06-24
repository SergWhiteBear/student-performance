from pydantic import BaseModel


class BaseStudent(BaseModel):
    id: int | None = None
    full_name: str
    math_score: int
    russian_score: int
    ege_score: int

    session_1_passed: bool
    session_2_passed: bool
    session_3_passed: bool
    session_4_passed: bool

    direction_id: int

    predicted_success: float | None = 0.0