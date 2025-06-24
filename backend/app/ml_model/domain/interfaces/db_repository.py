from abc import ABC, abstractmethod
from app.ml_model.domain.entities import BaseMLModel
from pydantic import BaseModel


class IDBRepository(ABC):
    @abstractmethod
    async def get_by_id(self, model_id: int) -> BaseMLModel | None:
        pass

    @abstractmethod
    async def get_by_name(self, model_name: str) -> BaseMLModel | None:
        pass

    @abstractmethod
    async def create(self, data: BaseModel) -> BaseMLModel:
        pass

    @abstractmethod
    async def delete(self, model_id: int) -> None:
        pass

    @abstractmethod
    async def add_or_update(self, data: BaseModel) -> BaseMLModel:
        pass

    @abstractmethod
    async def list_all(self) -> list[BaseMLModel]:
        pass

    @abstractmethod
    async def get_by_direction_id(self, direction_id: int) -> BaseMLModel | None:
        pass
