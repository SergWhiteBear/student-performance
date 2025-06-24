from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class Direction(Base):
    __tablename__ = 'directions'

    name = Column(String, unique=True, nullable=False)

    students = relationship("Student",back_populates="direction", cascade="all, delete-orphan")
    ml_models = relationship("MLModel", back_populates="direction")
