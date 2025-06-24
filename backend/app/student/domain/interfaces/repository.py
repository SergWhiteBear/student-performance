from abc import ABC, abstractmethod

from pydantic import BaseModel

from app.student.domain.entities import BaseStudent


class IStudentRepository(ABC):

    @abstractmethod
    async def get_by_id(self, student_id: int) -> BaseStudent | None:
        pass

    @abstractmethod
    async def list_by_direction(self, direction_id: int) -> list[BaseStudent]:
        pass

    @abstractmethod
    async def create(self, data: BaseModel) -> BaseStudent:
        pass

    @abstractmethod
    async def update(self, student_id: int, values: BaseModel) -> bool:
        pass

    @abstractmethod
    async def delete_by_id(self, student_id: int) -> bool:
        pass

    @abstractmethod
    async def list_all(self, filters: BaseModel | None = None) -> list[BaseStudent]:
        pass

    @abstractmethod
    async def bulk_add(self, students: list[BaseStudent]) -> None:
        pass

    @abstractmethod
    async def get_students_with_relation(self, direction_id: int | None = None):
        pass

    @abstractmethod
    async def get_students_without_prediction(self, direction_id: int | None = None):
        pass

    @abstractmethod
    async def get_by_ids(self, student_ids: list[int]) -> list[BaseStudent]:
        pass