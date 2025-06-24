

import pandas as pd

from app.direction.domain.interfaces.repository import IDirectionRepository
from app.student.domain.entities import BaseStudent
from app.student.domain.interfaces.repository import IStudentRepository


class StudentImportService:
    def __init__(
        self,
        student_repo: IStudentRepository,
        direction_repo: IDirectionRepository,
    ):
        self.student_repo = student_repo
        self.direction_repo = direction_repo

    async def import_from_excel(self, file_bytes: bytes, sheet_name: str) -> int:
        df = pd.read_excel(file_bytes, sheet_name=sheet_name)

        required_columns = ["ФИО", "балл по Математике", "балл по Русскому", "сумма баллов ЕГЭ",
        "1 сессия", "2 сессия", "3 сессия", "4 сессия"]

        if not all(col in df.columns for col in required_columns):
            missing = [col for col in required_columns if col not in df.columns]
            raise ValueError(f"Не хватает колонок: {', '.join(missing)}")

        direction = await self.direction_repo.get_or_create(sheet_name)

        max_session = [df[col].max() for col in required_columns[-4:]]

        students = []
        for _, row in df.iterrows():
            student = BaseStudent(
                full_name=str(row["ФИО"]),
                math_score=row["балл по Математике"],
                russian_score=row["балл по Русскому"],
                ege_score=row["сумма баллов ЕГЭ"],
                session_1_passed=row["1 сессия"] == max_session[0],
                session_2_passed=row["2 сессия"] == max_session[1],
                session_3_passed=row["3 сессия"] == max_session[2],
                session_4_passed=row["4 сессия"] == max_session[3],
                direction_id=direction.id,
            )
            students.append(student)

        await self.student_repo.bulk_add(students)
        return len(students)