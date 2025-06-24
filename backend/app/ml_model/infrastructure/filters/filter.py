from pydantic import BaseModel

class MLModelFilterById(BaseModel):
    id: int

class MLModelFilterByName(BaseModel):
    name: str

class MLModelFilterByDirection(BaseModel):
    direction_id: int

class MLModelFilter(MLModelFilterByDirection, MLModelFilterByName):
    name: str | None = None
    direction_id: int | None = None