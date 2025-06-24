import io

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import StreamingResponse

from app.db.session_maker import TransactionSessionDep
from app.direction.infrastructure.repository import DirectionRepository
from app.student.infrastructure.filters.student import StudentFilterForRelation
from app.student.services.import_service import StudentImportService
from app.student.services.service import StudentService
from app.student.infrastructure.repository import StudentRepository
from app.student.presentation.student_schemas import StudentCreate, StudentFilter, StudentUpdate, \
    StudentFilterByDirection

router = APIRouter()


def get_student_service(session: AsyncSession = TransactionSessionDep) -> StudentService:
    repository = StudentRepository(session)
    return StudentService(repository)


def get_student_import_service(session: AsyncSession = TransactionSessionDep) -> StudentImportService:
    student_repo = StudentRepository(session)
    direction_repo = DirectionRepository(session)
    return StudentImportService(student_repo, direction_repo)


@router.post("/")
async def create_student(student: StudentCreate, service: StudentService = Depends(get_student_service), ):
    return await service.create_student(student)


@router.get("/")
async def get_all_students(service: StudentService = Depends(get_student_service), ):
    return await service.get_all_students()


@router.get("/filtered/")
async def get_filtered_students(
        filter_student: StudentFilter = Depends(), service: StudentService = Depends(get_student_service),
):
    return await service.get_filtered_students(filter_student)


@router.get("/with_relations")
async def get_student_with_relations(request: StudentFilterForRelation = Query(None),
                                     service: StudentService = Depends(get_student_service)):
    return await service.get_students_with_relations(request.direction_id, request.model_id)


@router.get("/without_prediction")
async def get_student_without_prediction(direction_id: int | None = Query(None),
                                         service: StudentService = Depends(get_student_service)):
    return await service.get_student_without_prediction(direction_id)


@router.get("/by_filters")
async def get_student_by_filters(filters: StudentFilterByDirection = Query(),
                                 service: StudentService = Depends(get_student_service)):
    return await service.get_filtered_students(filters)


@router.get("/{student_id}")
async def get_student(student_id: int, service: StudentService = Depends(get_student_service)):
    student = await service.get_student_by_id(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.put("/{student_id}")
async def update_student(student_id: int, student: StudentUpdate,
                         service: StudentService = Depends(get_student_service)):
    updated = await service.update_student(student_id, student)
    if not updated:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"status": "updated"}


@router.delete("/{student_id}")
async def delete_student(student_id: int, service: StudentService = Depends(get_student_service)):
    deleted = await service.delete_student(student_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"status": "deleted"}


@router.post("/upload")
async def upload_student(
        sheet_name: str,
        file: UploadFile = File(...),
        service: StudentImportService = Depends(get_student_import_service)):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Файл должен быть Excel (.xlsx)")

    file_bytes = await file.read()
    try:
        count = await service.import_from_excel(file_bytes, sheet_name=sheet_name)
        return {f"{count} студентов загружено"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Ошибка при загрузке файла")


@router.get("/template/")
async def download_student_template():
    df = pd.DataFrame(columns=[
        "ФИО", "балл по Математике", "балл по Русскому", "сумма баллов ЕГЭ",
        "1 сессия", "2 сессия", "3 сессия", "4 сессия"
    ])
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Название_направления")

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=student_template.xlsx"}
    )
