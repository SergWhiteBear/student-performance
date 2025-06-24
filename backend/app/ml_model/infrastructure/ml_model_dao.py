from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import BaseDAO
from app.ml_model.infrastructure.models.ml_model import MLModel


class MLModelDAO(BaseDAO[MLModel]):
    model = MLModel

    @classmethod
    async def add_or_update(cls, session: AsyncSession, model_data: dict):
        """Добавление или обновление модели"""
        model_name = model_data.get("name")
        model_direction = model_data.get("direction_id")

        # Ищем модель с таким именем
        result = await session.execute(select(MLModel).filter_by(name=model_name, direction_id=model_direction))
        model = result.scalar_one_or_none()

        if model:
            # Если модель уже существует, обновляем ее
            model.features = model_data.get("features", model.features)
            # Можно обновить другие поля модели, если нужно
        else:
            # Если модели нет, создаем новую запись
            model = MLModel(**model_data)
            session.add(model)
        await session.commit()
        return model


    @classmethod
    async def add_model(cls, session: AsyncSession, name: str, features: dict):
        ml_model = MLModel(name=name, features=features)
        session.add(ml_model)
        try:
            await session.flush()
            return ml_model
        except Exception as e:
            await session.rollback()
            raise e

    @staticmethod
    async def get_by_name(session: AsyncSession, model_name: str):
        try:
            # Запрос на получение модели по имени
            result = await session.execute(select(MLModel).filter_by(name=model_name))
            model = result.scalar_one_or_none()

            if model is None:
                raise HTTPException(status_code=404, detail=f"Model {model_name} not found")

            return model
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching model by name: {model_name}")
