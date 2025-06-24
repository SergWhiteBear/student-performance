from pydantic import BaseModel

from app.direction.domain.entities import BaseDirection, ExtendedDirection
from app.direction.domain.interfaces.repository import IDirectionRepository


class DirectionService:
    def __init__(self, direction_repository: IDirectionRepository):
        self.direction_repository = direction_repository

    async def get_direction_by_id(self, direction_id: int) -> BaseDirection | None:
        return await self.direction_repository.get_by_id(direction_id)

    async def create_direction(self, direction_id: int, name: str) -> BaseDirection:
        return await self.direction_repository.create(direction_id, name)

    async def update_direction(self, direction_id: int, values: BaseModel) -> bool:
        return await self.direction_repository.update(direction_id, values=values)

    async def delete_direction(self, direction_id: int) -> bool:
        return await self.direction_repository.delete(direction_id)

    async def list_all_directions(self) -> list[BaseDirection]:
        return await self.direction_repository.list_all()

    async def get_all_with_relationships(self) -> list[ExtendedDirection]:
        return await self.direction_repository.get_with_relationships()
