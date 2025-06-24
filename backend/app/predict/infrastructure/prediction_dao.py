from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.predict.infrastructure.models.prediction import Prediction

from app.db.base import BaseDAO

class PredictionDAO(BaseDAO):
    model = Prediction

    @classmethod
    async def add_or_update(cls, session: AsyncSession, values: list[BaseModel]):
        values_list = [item.model_dump(exclude_unset=True) for item in values]
        for value in values_list:
            stmt = select(Prediction).where(Prediction.student_id == value['student_id'])
            result = await session.execute(stmt)
            existing = result.scalars().first()

            if existing and existing.model_id == value['model_id']:  # Если записи существуют и id прогнозов совпадают
                if (existing.predicted_class != value['predicted_class']) or (
                        existing.predicted_prob != value['predicted_prob']):
                    existing.predicted_class = value['predicted_class']
                    existing.predicted_prob = value['predicted_prob']
            else:
                new_instance = Prediction(**value)
                session.add(new_instance)

        try:
            await session.flush()
        except SQLAlchemyError as e:
            await session.rollback()
            raise e

    @classmethod
    async def add_or_update_predictions(
            cls,
            session: AsyncSession,
            values: list[BaseModel],
    ) -> tuple[int, int]:
        values_list = [v.model_dump(exclude_unset=True) for v in values]
        new_count, updated_count = 0, 0

        for value in values_list:
            stmt = select(cls.model).where(
                cls.model.student_id == value["student_id"],
                cls.model.model_id == value["model_id"]
            )
            result = await session.execute(stmt)
            existing = result.scalars().first()

            if existing:
                if (
                        existing.predicted_class != value["predicted_class"] or
                        existing.predicted_prob != value["predicted_prob"]
                ):
                    existing.predicted_class = value["predicted_class"]
                    existing.predicted_prob = value["predicted_prob"]
                    updated_count += 1
                # Иначе пропускаем (не меняем)
            else:
                session.add(cls.model(**value))
                new_count += 1

        try:
            await session.flush()
        except SQLAlchemyError as e:
            await session.rollback()
            raise e

        return new_count, updated_count