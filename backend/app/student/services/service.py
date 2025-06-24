from pydantic import BaseModel

from app.student.infrastructure.repository import StudentRepository

from app.student.presentation.student_schemas import StudentCreate, StudentUpdate


class StudentService:
    def __init__(self, repository: StudentRepository):
        self.repository = repository

    async def create_student(self, student_data: StudentCreate):
        return await self.repository.create(student_data)

    async def get_all_students(self):
        return await self.repository.list_all(filters=None)

    async def get_filtered_students(self, filter_student: BaseModel):
        return await self.repository.list_all(filters=filter_student)

    async def get_student_by_id(self, student_id: int):
        return await self.repository.get_by_id(student_id)

    async def update_student(self, student_id: int, student_data: StudentUpdate):
        return await self.repository.update(student_id, student_data)

    async def delete_student(self, student_id: int):
        return await self.repository.delete_by_id(student_id)

    async def get_students_with_relations(self, direction_id, model_id):
        return await self.repository.get_students_with_relation(direction_id, model_id)

    async def get_student_without_prediction(self, direction_id):
        return await self.repository.get_students_without_prediction(direction_id)

    async def get_students_by_ids(self, student_ids: list[int]):
        return await self.repository.get_by_ids(student_ids)
