from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.ml_model.infrastructure.models.ml_model import MLModel


class Prediction(Base):
    __tablename__ = 'prediction'

    student_id = Column(Integer, ForeignKey("student.id"), nullable=False)
    predicted_class = Column(Integer, nullable=False)
    predicted_prob = Column(Float, nullable=False)
    model_id = Column(Integer, ForeignKey("ml_model.id"), nullable=False)  # Связь с моделью

    student = relationship("Student", back_populates="prediction")
    ml_models = relationship(MLModel, back_populates="prediction")