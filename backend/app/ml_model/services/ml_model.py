import pandas as pd
from pandas import DataFrame
from pydantic import BaseModel
from sklearn.model_selection import train_test_split
import statsmodels.api as sm
from sqlalchemy.dialects.mssql.information_schema import columns

from app.direction.infrastructure.filters.direction import DirectionFilterByDirectionId
from app.ml_model.domain.entities import BaseMLModel
from app.ml_model.domain.interfaces.db_repository import IDBRepository
from app.ml_model.domain.interfaces.ml_model_repository import IMLModelRepository
from app.ml_model.services.prediction_data import PredictionDataService
from app.ml_model.services.storage_manager import ModelStorageManager
from app.ml_model.services.data_processor import DataProcessor
from app.predict.domain.entities import PredictionEntity
from app.predict.domain.interfaces.repository import IPredictionRepository
from app.student.domain.interfaces.repository import IStudentRepository


class MLModelService:
    def __init__(self, student_repository: IStudentRepository, db_repository: IDBRepository,
                 predict_repository: IPredictionRepository, ml_model_repository: IMLModelRepository):
        self.model = None
        self.processor = DataProcessor()
        self.storage = ModelStorageManager()
        self.student_repository = student_repository
        self.db_repository = db_repository
        self.ml_model_repository = ml_model_repository
        self.predict_repository = predict_repository
        self.prediction_data_service = PredictionDataService(student_repository)

    async def get_model_by_id(self, model_id: int) -> BaseMLModel | None:
        return await self.db_repository.get_by_id(model_id)

    async def get_model_by_name(self, model_name: str) -> BaseMLModel | None:
        return await self.db_repository.get_by_name(model_name)

    async def get_model_by_direction(self, direction_id: int) -> list[BaseMLModel] | None:
        return await self.db_repository.get_by_direction_id(direction_id)

    async def create_model(self, data: BaseModel) -> BaseMLModel:
        return await self.db_repository.create(data)

    async def add_or_update(self, data: BaseModel) -> BaseMLModel:
        return await self.db_repository.add_or_update(data)

    async def delete_model(self, model_id: int) -> None:
        model = await self.get_model_by_id(model_id)
        self.storage.delete(model.name)
        return await self.db_repository.delete(model_id)

    async def prepare_data(self, direction_id: int, fields: list[str], target: str) -> DataFrame:
        students = await self.student_repository.list_all(
            filters=DirectionFilterByDirectionId(direction_id=direction_id))
        dicts = [s.__dict__ for s in students]

        df = pd.DataFrame(dicts)
        required = set(fields + [target, "full_name"])

        if not required.issubset(df.columns):
            raise ValueError(f"Отсутствуют поля: {required - set(df.columns)}")

        return df[fields + [target] + ["full_name"]]

    async def train_model(self, data: pd.DataFrame, target_column: str, model_name: str, direction_id: int,
                          model_type: str) -> None:
        self.ml_model_repository.model_type = model_type
        X_scaled, y, fio = self.processor.fit_transform(
            df=data,
            target_col=target_column,
            fio_col="full_name"
        ) # перенести в prepare_data
        feature_columns = list(X_scaled.columns)

        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.3, random_state=12
        ) # перенести в prepare_data

        self.model = self.ml_model_repository.fit(X_train=X_train, y_train=y_train)
        self.ml_model_repository.evaluate(X_test=X_test, y_test=y_test)
        self.ml_model_repository.save_model(model_name, direction_id)
        await self.db_repository.add_or_update(
            BaseMLModel(name=model_name, features=feature_columns, direction_id=direction_id))

    async def load(self, model_name: str):
        return self.ml_model_repository.load_model(model_name)

    async def list_all_models(self) -> list[BaseMLModel]:
        return await self.db_repository.list_all()

    async def predict_for_students(
            self,
            model_id: id,
            students: list,
    ) -> list[PredictionEntity]:
        if not students:
            return []

        model_data = await self.get_model_by_id(model_id)
        model_name = model_data.name
        loaded_repo = await self.load(model_name)
        if not loaded_repo.result:
            raise ValueError(f"Модель '{model_name}' не загружена")

        feature_columns = loaded_repo.X_train.drop(columns='const').columns.tolist()

        model_entity = await self.get_model_by_name(model_name)
        if not model_entity:
            raise ValueError(f"Модель '{model_name}' не найдена в БД")


        df = pd.DataFrame([
            {**{col: getattr(s, col) for col in feature_columns}, "student_id": s.id}
            for s in students
        ])

        if df.empty:
            return []

        X = df[feature_columns]
        X = X.applymap(lambda x: int(x) if isinstance(x, bool) else x)
        X = sm.add_constant(X, has_constant='add')
        y_prob = loaded_repo.result.predict(X)
        y_class = (y_prob >= 0.5).astype(int)

        predictions = [
            PredictionEntity(
                student_id=int(df.iloc[i]["student_id"]),
                predicted_class=int(y_class[i]),
                predicted_prob=float(y_prob[i]),
                model_id=model_entity.id
            )
            for i in range(len(df))
        ]

        await self.predict_repository.add_many_predictions(predictions)
        return predictions

    async def get_list_of_margin_effect(self, target_name: str, x_values: list[int], model_id: int) -> dict:
        model_data = await self.get_model_by_id(model_id)
        model_name = model_data.name
        loaded_repo = await self.load(model_name)

        margin_effects = loaded_repo.get_margin_effect(
            target_name=target_name,
            x_values=x_values
        )

        return margin_effects
