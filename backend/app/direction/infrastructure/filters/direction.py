from pydantic import BaseModel


class DirectionFilterById(BaseModel):
    id: int

class DirectionFilterByDirectionId(BaseModel):
    direction_id: int