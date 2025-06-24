from pydantic import BaseModel
from sqlalchemy import select, outerjoin
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import contains_eager
from app.db.base import BaseDAO
from app.predict.infrastructure.models.prediction import Prediction
from app.student.infrastructure.models.student import Student


class StudentDAO(BaseDAO):
    model = Student

    @classmethod
    async def get_students_without_predictions(cls, session: AsyncSession, direction_id: int | None = None):
        try:
            stmt = (
                select(Student)
                .outerjoin(Prediction, Prediction.student_id == Student.id)
                .where(Prediction.id.is_(None))  # <-- студенты без прогноза
            )

            if direction_id is not None:
                stmt = stmt.where(Student.direction_id == direction_id)

            stmt = stmt.options(joinedload(Student.direction))

            result = await session.execute(stmt)
            return result.unique().scalars().all()
        except SQLAlchemyError as e:
            await session.rollback()
            raise e

    @classmethod
    async def get_with_relationships(
            cls,
            session: AsyncSession,
            filters: BaseModel | None,
            relationships: list[str],
            prediction_model_id: int | None = None
    ):
        if filters:
            filter_dict = filters.model_dump(exclude_unset=True, exclude_none=True)
        else:
            filter_dict = {}

        try:
            query = select(cls.model).filter_by(**filter_dict)

            for relation in relationships:
                if relation == "prediction" and prediction_model_id is not None:
                    # LEFT OUTER JOIN по predictions с условием ON predictions.model_id = ...
                    prediction_join = (
                        outerjoin(cls.model, Prediction,
                                  (Prediction.student_id == cls.model.id) &
                                  (Prediction.model_id == prediction_model_id))
                    )
                    query = query.select_from(prediction_join)
                    query = query.options(contains_eager(cls.model.prediction, alias=Prediction))
                else:
                    # Обычный joinedload для других связей
                    relations_path = relation.split('.')
                    current_option = joinedload(getattr(cls.model, relations_path[0]))
                    for rel in relations_path[1:]:
                        current_option = current_option.joinedload(
                            getattr(getattr(cls.model, relations_path[0]).property.mapper.class_, rel)
                        )
                    query = query.options(current_option)

            result = await session.execute(query)
            await session.flush()
            return result.unique().scalars().all()

        except SQLAlchemyError as e:
            await session.rollback()
            raise e