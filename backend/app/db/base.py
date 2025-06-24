from typing import TypeVar, Generic, List
from pydantic import BaseModel
from sqlalchemy import select, update as sqlalchemy_update, delete as sqlalchemy_delete
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db.database import Base

T = TypeVar("T", bound=Base)


class BaseDAO(Generic[T]):
    model: type[T]

    @classmethod
    async def get_all(cls, session: AsyncSession, filters: BaseModel | None):
        if filters:
            filter_dict = filters.model_dump(exclude_unset=True, exclude_none=True)
        else:
            filter_dict = {}
        try:
            query = select(cls.model).filter_by(**filter_dict)
            result = await session.execute(query)
            record = result.scalars().all()
            return record
        except SQLAlchemyError as e:
            raise e

    @classmethod
    async def find_one_or_none_by_id(cls, data_id: int, session: AsyncSession):
        try:
            query = select(cls.model).filter(cls.model.id == data_id)
            result = await session.execute(query)
            record = result.scalar_one_or_none()
            return record
        except SQLAlchemyError as e:
            raise e

    @classmethod
    async def find_one_or_none(cls, session: AsyncSession, filters: BaseModel):
        filter_dict = filters.model_dump(exclude_unset=True)
        try:
            query = select(cls.model).filter_by(**filter_dict)
            result = await session.execute(query)
            record = result.scalar_one_or_none()
            return record
        except SQLAlchemyError as e:
            raise e

    @classmethod
    async def add(cls, session: AsyncSession, values: BaseModel):
        values_dict = values.model_dump(exclude_unset=True)
        new_instance = cls.model(**values_dict)
        session.add(new_instance)
        try:
            await session.flush()
        except SQLAlchemyError as e:
            await session.rollback()
            raise e
        return new_instance

    @classmethod
    async def add_many(cls, session: AsyncSession, values: List[BaseModel]):
        values_list = [item.model_dump(exclude_unset=True) for item in values]
        new_instances = [cls.model(**values) for values in values_list]
        session.add_all(new_instances)
        try:
            await session.flush()
        except SQLAlchemyError as e:
            await session.rollback()
            raise e
        return new_instances

    @classmethod
    async def update(cls, session: AsyncSession, filters: BaseModel, values: BaseModel):
        filter_dict = filters.model_dump(exclude_unset=True, exclude_none=True)
        values_dict = values.model_dump(exclude_unset=True)
        query = (
            sqlalchemy_update(cls.model)
            .where(*[getattr(cls.model, k) == v for k, v in filter_dict.items()])
            .values(**values_dict)
            .execution_options(synchronize_session="fetch")
        )
        try:
            result = await session.execute(query)
            await session.flush()
            return result.rowcount
        except SQLAlchemyError as e:
            await session.rollback()
            raise e

    @classmethod
    async def delete(cls, session: AsyncSession, filters: BaseModel):
        filter_dict = filters.model_dump(exclude_unset=True, exclude_none=True)
        if not filter_dict:
            raise ValueError("Need filters")
        query = sqlalchemy_delete(cls.model).filter_by(**filter_dict)
        try:
            result = await session.execute(query)
            await session.flush()
            return result.rowcount
        except SQLAlchemyError as e:
            await session.rollback()
            raise e

    @classmethod
    async def get_with_relationships(cls, session: AsyncSession, filters: BaseModel | None,
                                     relationships: list[str]):
        if filters:
            filter_dict = filters.model_dump(exclude_unset=True, exclude_none=True)
        else:
            filter_dict = {}

        try:
            query = select(cls.model).filter_by(**filter_dict)

            for relation in relationships:
                relations_path = relation.split('.')
                current_option = joinedload(getattr(cls.model, relations_path[0]))

                for rel in relations_path[1:]:
                    current_option = current_option.joinedload(
                        getattr(getattr(cls.model, relations_path[0]).property.mapper.class_, rel))

                query = query.options(current_option)

            result = await session.execute(query)
            await session.flush()
            return result.unique().scalars().all()
        except SQLAlchemyError as e:
            await session.rollback()
            raise e

    @classmethod
    async def add_or_update(cls, session: AsyncSession, values: BaseModel):
        values_dict = values.model_dump(exclude_unset=True)

        stmt = select(cls.model)
        result = await session.execute(stmt)
        existing_record = result.scalars().first()

        if existing_record:
            # Если запись существует, обновляем её
            for key, value in values_dict.items():
                setattr(existing_record, key, value)
        else:
            # Если записи нет, создаем новую
            new_instance = cls.model(**values_dict)
            session.add(new_instance)

        try:
            await session.flush()
        except SQLAlchemyError as e:
            await session.rollback()
            raise e
        return existing_record or new_instance

