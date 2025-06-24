import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    pass

#settings = Settings()

database_url = "sqlite+aiosqlite:///./test.db"  # f'postgresql+asyncpg://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}'
