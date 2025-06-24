from pydantic import BaseModel


class BaseMLModel(BaseModel):
    id: int | None = None
    name: str
    features: list[str]
    direction_id: int
