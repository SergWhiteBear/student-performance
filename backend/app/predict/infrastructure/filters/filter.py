from pydantic import BaseModel


class PredictionFilter(BaseModel):
    student_id: int