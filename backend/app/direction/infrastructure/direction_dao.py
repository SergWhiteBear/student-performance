from sqlalchemy import select

from app.direction.infrastructure.models.direction import Direction

from app.db.base import BaseDAO

class DirectionDAO(BaseDAO):
    model = Direction

    @classmethod
    async def get_or_create_by_name(cls, session, name: str) -> Direction:
        query = select(cls.model).filter_by(name=name)
        result = await session.execute(query)
        direction = result.scalar_one_or_none()

        if direction:
            return direction

        direction = cls.model(name=name)
        session.add(direction)
        await session.flush()
        return direction
