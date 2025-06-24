from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.db.database import init_db
from app.student.presentation.crud_student import router as student_router
from app.direction.presentation.router import router as direction_router
from app.ml_model.presentation.routes import router as ml_router
from app.predict.presentation.router import router as predict_router
from app.analysis.presentation.router import router as analysis_router
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Выполняется при запуске приложения
    await init_db()
    yield
    # Здесь можно указать код для завершения работы (опционально)
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(student_router, prefix="/students", tags=["students"])
app.include_router(direction_router, prefix="/directions", tags=["directions"])
app.include_router(ml_router, prefix="/ml", tags=["ml"])
app.include_router(predict_router, prefix="/predict", tags=["predict"])
app.include_router(analysis_router, prefix="/analysis", tags=["analysis"])