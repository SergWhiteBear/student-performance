from pydantic import BaseModel
from typing import Optional


class StudentFilterById(BaseModel):
    id: int


class StudentFilterByDirection(BaseModel):
    direction_id: int

class StudentFilterForRelation(BaseModel):
    direction_id: int | None = None
    model_id: int | None = None

class StudentGeneralFilter(BaseModel):
    full_name: Optional[str] = None
    direction_id: Optional[int] = None
    session_1_passed: Optional[bool] = None