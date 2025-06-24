from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.predict.domain.entities import PredictionEntity
from app.predict.domain.interfaces.repository import IPredictionRepository
from app.predict.infrastructure.filters.filter import PredictionFilter
from app.predict.infrastructure.models.prediction import Prediction
from app.predict.infrastructure.prediction_dao import PredictionDAO
from app.student.infrastructure.models.student import Student


class PredictRepository(IPredictionRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add_prediction(self, prediction: PredictionEntity) -> None:
        await PredictionDAO.add(
            self.session,
            values=BaseModel(
                student_id=prediction.student_id,
                predicted_class=prediction.predicted_class,
                predicted_prob=prediction.predicted_prob
            ))

    async def get_predictions_by_student_id(self, student_id: int) -> list[PredictionEntity]:
        filters = PredictionFilter(student_id=student_id)
        pred = await PredictionDAO.get_all(self.session, filters=filters)
        return pred

    async def get_all_predictions(self) -> list[PredictionEntity]:
        predictions = await PredictionDAO.get_all(self.session, filters=None)
        return [
            PredictionEntity(
                id=p.id,
                student_id=p.student_id,
                predicted_class=p.predicted_class,
                predicted_prob=p.predicted_prob,
                model_id=p.prediction_id
            )
            for p in predictions
        ]

    async def add_many_predictions(self, predictions: list[PredictionEntity]) -> int:
        new_count, updated_count = await PredictionDAO.add_or_update_predictions(self.session, predictions)
        return new_count + updated_count # потом поправить нормально

    async def get_prediction_data_by_model_id(self, model_id: int):
        result = await self.session.execute(
            select(Prediction.student_id, Prediction.predicted_class, Prediction.predicted_prob)
            .join(Student, Student.id == Prediction.student_id)
            .filter(Prediction.model_id == model_id)
        )
        return result.all()