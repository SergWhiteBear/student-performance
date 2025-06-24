from pydantic import BaseModel

from app.db.database import AsyncSession

from app.direction.domain.entities import BaseDirection, ExtendedDirection
from app.direction.domain.interfaces.repository import IDirectionRepository
from app.direction.infrastructure.direction_dao import DirectionDAO
from app.direction.infrastructure.filters.direction import DirectionFilterById


class DirectionRepository(IDirectionRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, direction_id: int) -> BaseDirection | None:
        direction = await DirectionDAO.find_one_or_none_by_id(direction_id, self.session)
        if direction:
            return BaseDirection(id=direction.id, name=direction.name)
        return None

    async def create(self, direction_id: int, name: str) -> BaseDirection:
        new_direction = await DirectionDAO.add(session=self.session, values=BaseDirection(id=direction_id, name=name))
        self.session.add(new_direction)
        await self.session.commit()
        return BaseDirection(id=new_direction.id, name=new_direction.name)

    async def update(self, direction_id: int, values: BaseModel) -> bool:
        filters = DirectionFilterById(id=direction_id)
        rowcount = await DirectionDAO.update(self.session, filters, values)
        return rowcount > 0

    async def delete(self, direction_id: int) -> bool:
        filters = DirectionFilterById(id=direction_id)
        rowcount = await DirectionDAO.delete(self.session, filters)
        return rowcount > 0

    async def list_all(self) -> list[BaseDirection]:
        orm_directions = await DirectionDAO.get_all(self.session, filters=None)
        return [d for d in orm_directions]

    async def get_or_create(self, name: str) -> BaseDirection:
        direction = await DirectionDAO.get_or_create_by_name(self.session, name)
        return BaseDirection(id=direction.id, name=direction.name)

    async def get_with_relationships(self) -> list[ExtendedDirection] | None:
        directions = await DirectionDAO.get_with_relationships(self.session, filters=None, relationships=["students"])

        return [
            ExtendedDirection(
                id=direction.id,
                name=direction.name,
                count_student=len(direction.students),
            )
            for direction in directions
        ]
