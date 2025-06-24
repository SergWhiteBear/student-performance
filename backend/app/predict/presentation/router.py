from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session_maker import TransactionSessionDep
from app.predict.infrastructure.repository import PredictRepository
from app.predict.presentation.schemas import PredictionRead
from app.predict.services.service import PredictService

router = APIRouter()


def get_service(session: AsyncSession = TransactionSessionDep) -> PredictService:
    repo = PredictRepository(session)
    return PredictService(repo)


@router.get("/student/{student_id}", response_model=list[PredictionRead])
async def get_predictions_by_student(student_id: int, service: PredictService = Depends(get_service)):
    return await service.get_predictions_by_student(student_id)


@router.get("/", response_model=list[PredictionRead])
async def get_all_predictions(service: PredictService = Depends(get_service)):
    return await service.get_all_predictions()
