from fastapi import APIRouter, Depends, Body

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session_maker import TransactionSessionDep
from app.direction.infrastructure.repository import DirectionRepository
from app.direction.presentation.direction_schemas import DirectionUpdate
from app.direction.services.service import DirectionService

router = APIRouter()

def get_direction_service(session: AsyncSession = TransactionSessionDep) -> DirectionService:
    direction_repository = DirectionRepository(session)
    return DirectionService(direction_repository)

@router.post("/")
async def create_direction(direction_id: int, name: str, service: DirectionService = Depends(get_direction_service)):
    return await service.create_direction(direction_id, name)

@router.get("/{direction_id}")
async def get_direction(direction_id: int, service: DirectionService = Depends(get_direction_service)):
    return await service.get_direction_by_id(direction_id)

@router.put("/{direction_id}")
async def update_direction(direction_id: int, values: DirectionUpdate = Body(...), service: DirectionService = Depends(get_direction_service)):
    return await service.update_direction(direction_id, values)

@router.delete("/{direction_id}")
async def delete_direction(direction_id: int, service: DirectionService = Depends(get_direction_service)):
    return await service.delete_direction(direction_id)

@router.get("/all/")
async def list_directions(service: DirectionService = Depends(get_direction_service)):
    return await service.get_all_with_relationships()
