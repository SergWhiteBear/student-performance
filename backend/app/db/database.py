from datetime import datetime
from typing import Dict, Any
from sqlalchemy import TIMESTAMP, func, Integer, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker, AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, declared_attr, Mapped, mapped_column
from app.db.config import database_url

engine = create_async_engine(url=database_url,
    pool_size=10,  # Количество соединений в пуле
    max_overflow=20,  # Сколько соединений может быть открыто сверх лимита
    pool_timeout=30,  # Время ожидания в секундах, пока соединение не будет доступно в пуле
    pool_recycle=3600,  # Время жизни соединения (в секундах), после которого оно будет закрыто
    echo=True,  # Логирование всех запросов
    )
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def enable_sqlite_pragma(conn):
    if "sqlite" in str(conn.engine.url):
        await conn.execute(text("PRAGMA foreign_keys=ON;"))
        await conn.commit()

# Вызываем один раз при старте
async def init_db():
    async with engine.begin() as conn:
        await enable_sqlite_pragma(conn)

class Base(AsyncAttrs, DeclarativeBase):
    __abstract__ = True

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now()
    )

    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower() + 's'

    def to_dict(self) -> Dict[str, Any]:
        # Метод для преобразования объекта в словарь
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
