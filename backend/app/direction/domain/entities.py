from pydantic import BaseModel


class BaseDirection(BaseModel):
    id: int | None = None
    name: str

class ExtendedDirection(BaseDirection):
    count_student: int