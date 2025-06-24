from pydantic import BaseModel

from app.db.database import AsyncSession
from app.ml_model.domain.entities import BaseMLModel
from app.ml_model.domain.interfaces.db_repository import IDBRepository
from app.ml_model.infrastructure.filters.filter import MLModelFilterByName, MLModelFilterByDirection, MLModelFilter, \
    MLModelFilterById
from app.ml_model.infrastructure.ml_model_dao import MLModelDAO


class DBRepository(IDBRepository):

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, model_id: int) -> BaseMLModel | None:
        model = await MLModelDAO.find_one_or_none_by_id(model_id, self.session)
        if model:
            return BaseMLModel(id=model.id, name=model.name, features=model.features, direction_id=model.direction_id)
        return None

    async def get_by_name(self, model_name: str) -> BaseMLModel | None:
        model = await MLModelDAO.find_one_or_none(self.session, filters=MLModelFilterByName(name=model_name))
        if model:
            return BaseMLModel(id=model.id, name=model.name, features=model.features, direction_id=model.direction_id)
        return None

    async def get_by_direction_id(self, direction_id: int) -> list[BaseMLModel] | None:
        models = await MLModelDAO.get_all(self.session, filters=MLModelFilterByDirection(direction_id=direction_id))
        if models:
            return [BaseMLModel(id=model.id, name=model.name, features=model.features, direction_id=model.direction_id)
                    for model in models]
        return None

    async def create(self, data: BaseModel) -> BaseMLModel:
        new_ml_model = await MLModelDAO.add(session=self.session, values=data)
        return BaseMLModel(id=new_ml_model.id, name=new_ml_model.name, features=new_ml_model.features,
                           direction_id=new_ml_model.direction_id)

    async def delete(self, model_id: int) -> None:
        await MLModelDAO.delete(filters=MLModelFilterById(id=model_id), session=self.session)

    async def add_or_update(self, data: BaseModel) -> BaseMLModel:
        model = await MLModelDAO.add_or_update(self.session, data.model_dump())
        return BaseMLModel(id=model.id, name=model.name, features=model.features, direction_id=model.direction_id)

    async def list_all(self) -> list[BaseMLModel]:
        orm_ml_models = await MLModelDAO.get_all(self.session, filters=None)
        return [BaseMLModel(id=ml_model.id, name=ml_model.name, features=ml_model.features,
                            direction_id=ml_model.direction_id) for ml_model in
                orm_ml_models]
