from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request

from app.api.dependencies.ml import get_student_service
from app.db.session_maker import TransactionSessionDep
from app.ml_model.infrastructure.ml_model_repository import MLModelRepository
from app.ml_model.presentation.schemas import MLModelOut, PredictRequest, ModelTrainRequest, ModelMarginEffect
from app.ml_model.services.ml_model import MLModelService
from app.ml_model.infrastructure.db_repository import DBRepository
from app.predict.infrastructure.repository import PredictRepository

from app.student.infrastructure.repository import StudentRepository
from app.student.services.service import StudentService

router = APIRouter()


def get_ml_model_service(session: AsyncSession = TransactionSessionDep):
    student_repo = StudentRepository(session)
    db_repo = DBRepository(session)
    predict_repo = PredictRepository(session)
    ml_repo = MLModelRepository(model_type="logit")
    return MLModelService(student_repo, db_repo, predict_repo, ml_repo)


@router.get("/id/{model_id}", response_model=MLModelOut)
async def get_model_by_id(
        model_id: int,
        service: MLModelService = Depends(get_ml_model_service),
):
    model = await service.get_model_by_id(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@router.get("/direction/{direction_id}", response_model=list[MLModelOut])
async def get_model_by_id(
        direction_id: int,
        service: MLModelService = Depends(get_ml_model_service),
):
    models = await service.get_model_by_direction(direction_id)
    if not models:
        raise HTTPException(status_code=404, detail="Model not found")
    return models


@router.get("/", response_model=list[MLModelOut])
async def list_all_models(
        service: MLModelService = Depends(get_ml_model_service),
):
    return await service.list_all_models()


@router.delete("/{model_id}")
async def delete_model(
        model_id: int,
        service: MLModelService = Depends(get_ml_model_service),
):
    await service.delete_model(model_id)
    return {"status": "deleted"}


@router.post("/train/")
async def train_model(
        request: ModelTrainRequest,
        service: MLModelService = Depends(get_ml_model_service),
):
    df = await service.prepare_data(request.direction_id, request.fields, request.target)
    await service.train_model(df, request.target, request.model_name, request.direction_id, model_type=request.model_type.value)
    return {
        "status": "trained",
    }

@router.post("/predict/by_ids")
async def predict_by_ids(
        request: PredictRequest,
        student_service: StudentService = Depends(get_student_service),
        ml_model_service: MLModelService = Depends(get_ml_model_service),
):
    ids = request.ids
    model_id = request.model_id
    students = await student_service.get_students_by_ids(ids)

    if not students:
        raise HTTPException(status_code=404, detail="Студенты не найдены")


    predictions = await ml_model_service.predict_for_students(model_id, students)
    return predictions


@router.get("/load")
async def load_model(
        model_id: int,
        request: Request,
        service: MLModelService = Depends(get_ml_model_service),
):
    try:
        model_data = await service.get_model_by_id(model_id)
        loaded_model = await service.load(model_data.name)
        if not hasattr(request.app.state, "models"):
            request.app.state.models = {}

        request.app.state.models[model_data.id] = loaded_model

        return {
            "status": "loaded",
            "feature_columns": loaded_model.X_train.columns.tolist(),
            "metrics": loaded_model.metrics,
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при загрузке модели")

@router.get("/{model_id}/metrics")
async def get_model_metrics(
    model_id: int,
    service: MLModelService = Depends(get_ml_model_service),
):
    try:
        model_data = await service.get_model_by_id(model_id)
        model = await service.load(model_data.name)
        return {
            "metrics": model.metrics,
            "feature_columns": model.X_train.columns.tolist(),
            "direction_id": model_data.direction_id,
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Модель не найдена")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении метрик: {str(e)}")


@router.post("/margin_effect")
async def get_margin_effect(
        request: ModelMarginEffect,
        service: MLModelService = Depends(get_ml_model_service),
):
    try:
        margin_effects = await service.get_list_of_margin_effect(request.target_name, request.x_values, request.model_id)
        return margin_effects
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении предельных эффектов: {str(e)}")