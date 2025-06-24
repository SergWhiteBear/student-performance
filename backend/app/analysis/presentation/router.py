from fastapi import APIRouter, Query, HTTPException, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies.ml import get_model_from_state
from app.db.session_maker import TransactionSessionDep

from app.analysis.services.services import ProbabilityAnalysisService
from app.ml_model.infrastructure.db_repository import DBRepository
from app.predict.infrastructure.repository import PredictRepository
from app.student.infrastructure.repository import StudentRepository

router = APIRouter()


def get_service(session: AsyncSession = TransactionSessionDep) -> ProbabilityAnalysisService:
    db_repository = DBRepository(session)
    student_repository = StudentRepository(session)
    prediction_repository = PredictRepository(session)
    return ProbabilityAnalysisService(db_repository, student_repository, prediction_repository)


@router.get("/probability-intervals")
async def get_probability_intervals(
        request: Request,
        model_id: int,
        target_feature: str = Query(...),
        direction_id: int = Query(...),
        service: ProbabilityAnalysisService = Depends(get_service),
):

    #model_data = get_model_from_state(request, model_id)
    try:
        result = await service.get_probability_intervals(model_id, target_feature, direction_id)
        return {"probability_intervals": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
