from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.student.domain.entities import BaseStudent
from app.student.domain.interfaces.repository import IStudentRepository
from app.student.infrastructure.filters.student import StudentFilterByDirection, StudentFilterById, \
    StudentFilterForRelation
from app.student.infrastructure.models.student import Student
from app.student.infrastructure.student_dao import StudentDAO


class StudentRepository(IStudentRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _map_to_domain(self, orm_student: Student) -> BaseStudent:
        return BaseStudent(
            id=orm_student.id,
            full_name=orm_student.full_name,
            math_score=orm_student.math_score,
            russian_score=orm_student.russian_score,
            ege_score=orm_student.ege_score,
            session_1_passed=orm_student.session_1_passed,
            session_2_passed=orm_student.session_2_passed,
            session_3_passed=orm_student.session_3_passed,
            session_4_passed=orm_student.session_4_passed,
            predicted_success=orm_student.predicted_success,
            direction_id=orm_student.direction_id,
        )

    async def get_by_id(self, student_id: int) -> BaseStudent | None:
        orm_student = await StudentDAO.find_one_or_none_by_id(student_id, self.session)
        if orm_student:
            return self._map_to_domain(orm_student)
        return None

    async def list_by_direction(self, direction_id: int) -> list[BaseStudent]:
        filters = StudentFilterByDirection(direction_id=direction_id)
        orm_students = await StudentDAO.get_all(self.session, filters)
        return [self._map_to_domain(s) for s in orm_students]

    async def create(self, data: BaseModel) -> BaseStudent:
        orm_student = await StudentDAO.add(self.session, data)
        return self._map_to_domain(orm_student)

    async def update(self, student_id: int, values: BaseModel) -> bool:
        filters = StudentFilterById(id=student_id)
        rowcount = await StudentDAO.update(self.session, filters, values)
        return rowcount > 0

    async def delete_by_id(self, student_id: int) -> bool:
        filters = StudentFilterById(id=student_id)
        rowcount = await StudentDAO.delete(self.session, filters)
        return rowcount > 0

    async def list_all(self, filters: BaseModel | None = None) -> list[BaseStudent]:
        orm_students = await StudentDAO.get_all(self.session, filters)
        return [self._map_to_domain(s) for s in orm_students]

    async def bulk_add(self, students: list[BaseStudent]) -> None:
        await StudentDAO.add_many(self.session, students)

    async def get_students_with_relation(self, direction_id: int | None = None, model_id: int | None = None):
        filters = None if direction_id is None else StudentFilterByDirection(direction_id=direction_id)
        return await StudentDAO.get_with_relationships(
            session=self.session,
            filters=filters,
            relationships=["prediction", "direction"],
            prediction_model_id = model_id
        )

    async def get_students_without_prediction(self, direction_id: int | None = None):
        return await StudentDAO.get_students_without_predictions(self.session, direction_id)

    async def get_by_ids(self, student_ids: list[int]) -> list[BaseStudent]:
        stmt = select(Student).where(Student.id.in_(student_ids))
        result = await self.session.execute(stmt)
        students = result.scalars().all()
        return [self._map_to_domain(student) for student in students]
