from abc import ABC, abstractmethod
from app.predict.domain.entities import PredictionEntity


class IPredictionRepository(ABC):
    @abstractmethod
    async def add_prediction(self, prediction: PredictionEntity) -> PredictionEntity:
        pass

    @abstractmethod
    async def get_predictions_by_student_id(self, student_id: int) -> PredictionEntity:
        pass

    @abstractmethod
    async def get_all_predictions(self) -> list[PredictionEntity]:
        pass

    @abstractmethod
    async def add_many_predictions(self, predictions: list[PredictionEntity]) -> int:
        pass

    @abstractmethod
    async def get_prediction_data_by_model_id(self, model_id: int):
        pass