from pydantic import BaseModel


class PredictionEntity(BaseModel):
    student_id: int
    predicted_class: int
    predicted_prob: float
    model_id: int
