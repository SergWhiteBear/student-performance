from abc import ABC, abstractmethod

from pydantic import BaseModel

from app.direction.domain.entities import BaseDirection, ExtendedDirection


class IDirectionRepository(ABC):
    @abstractmethod
    async def get_by_id(self, direction_id: int) -> BaseDirection | None:
        pass

    @abstractmethod
    async def create(self, direction_id: int, name: str) -> BaseDirection:
        pass

    @abstractmethod
    async def update(self, direction_id: int, values: BaseModel) -> bool:
        pass

    @abstractmethod
    async def delete(self, direction_id: int) -> bool:
        pass

    @abstractmethod
    async def list_all(self) -> list[BaseDirection]:
        pass

    @abstractmethod
    async def get_or_create(self, name: str) -> BaseDirection | None:
        pass

    @abstractmethod
    async def get_with_relationships(self) -> list[ExtendedDirection] | None:
        pass