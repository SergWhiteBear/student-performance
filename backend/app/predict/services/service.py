from app.predict.domain.entities import PredictionEntity
from app.predict.domain.interfaces.repository import IPredictionRepository


class PredictService:
    def __init__(self, repo: IPredictionRepository):
        self.repo = repo

    async def add_prediction(self, prediction: PredictionEntity) -> PredictionEntity:
        return await self.repo.add_prediction(prediction)

    async def get_predictions_by_student(self, student_id: int):
        return await self.repo.get_predictions_by_student_id(student_id)

    async def get_all_predictions(self):
        return await self.repo.get_all_predictions()

    async def add_many_predictions(self, predictions: list[PredictionEntity]):
        return await self.repo.add_many_predictions(predictions)