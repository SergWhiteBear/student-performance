import pandas as pd

from app.direction.infrastructure.filters.direction import DirectionFilterByDirectionId
from app.student.domain.interfaces.repository import IStudentRepository


class PredictionDataService:
    def __init__(self, student_repository: IStudentRepository):
        self.student_repository = student_repository

    async def get_students_for_prediction(self, direction_id: int, feature_columns: list[str], only_new: bool = False) -> pd.DataFrame:
        students = await self.student_repository.list_all(filters=DirectionFilterByDirectionId(direction_id=direction_id))

        if only_new:
            predicted_ids = await self.student_repository.get_students_without_prediction(direction_id)
            students = [s for s in students if s.id not in predicted_ids]

        if not students:
            return pd.DataFrame()

        df = pd.DataFrame([{col: getattr(s, col) for col in feature_columns} for s in students])
        df["student_id"] = [s.id for s in students]
        return df
