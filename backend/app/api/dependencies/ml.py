from fastapi import Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session_maker import TransactionSessionDep
from app.student.infrastructure.repository import StudentRepository
from app.student.services.service import StudentService


def get_model_from_state(request: Request, model_id: int):
    models = getattr(request.app.state, "models", None)
    if not models or model_id not in models:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not loaded. Call /load/?model_name=... first.")
    return models[model_id]

def get_student_service(session: AsyncSession = TransactionSessionDep) -> StudentService:
    repo = StudentRepository(session)
    return StudentService(repo)