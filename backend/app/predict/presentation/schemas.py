from pydantic import BaseModel


class PredictionCreate(BaseModel):
    student_id: int
    predicted_class: int
    predicted_prob: float
    prediction_id: int


class PredictionRead(PredictionCreate):
    pass

    class Config:
        orm_mode = True
