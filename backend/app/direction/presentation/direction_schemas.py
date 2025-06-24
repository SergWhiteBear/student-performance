from pydantic import BaseModel

class DirectionCreate(BaseModel):
    name: str

class DirectionUpdate(BaseModel):
    name: str | None = None

class DirectionFilter(BaseModel):
    name: str | None = None
    id: int | None = None