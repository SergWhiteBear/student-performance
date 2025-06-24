from sqlalchemy import Column, Integer, JSON, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base



class MLModel(Base):
    __tablename__ = 'ml_model'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)  # название модели
    features = Column(JSON, nullable=False)  # Хранение признаков в JSON

    prediction = relationship("Prediction", back_populates="ml_models", uselist=False)
    direction_id = Column(Integer, ForeignKey("directions.id", ondelete='SET NULL'), nullable=True)
    direction = relationship("Direction", back_populates="ml_models")