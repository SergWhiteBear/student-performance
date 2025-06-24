from enum import Enum

from pydantic import BaseModel
from typing import Optional

class MLModelBase(BaseModel):
    name: str
    description: Optional[str] = None

class MLModelCreate(MLModelBase):
    pass

class MLModelUpdate(MLModelBase):
    pass

class MLModelOut(MLModelBase):
    id: int

    class Config:
        orm_mode = True

class PredictRequest(BaseModel):
    ids: list[int]
    model_id: int

class ModelType(str, Enum):
    logit = "logit"
    probit = "probit"

class ModelTrainRequest(BaseModel):
    direction_id: int
    fields: list[str]
    target: str
    model_name: str
    model_type: ModelType = ModelType.logit

class ModelMarginEffect(BaseModel):
    target_name: str
    x_values: list[int]
    model_id: int