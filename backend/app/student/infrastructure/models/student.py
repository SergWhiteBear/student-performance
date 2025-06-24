from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.direction.infrastructure.models.direction import Direction
from app.predict.infrastructure.models.prediction import Prediction


class Student(Base):
    __tablename__ = 'student'

    full_name = Column(String, nullable=False)
    math_score = Column(Integer, nullable=False)
    russian_score = Column(Integer, nullable=False)
    ege_score = Column(Integer, nullable=False)

    session_1_passed = Column(Boolean, default=False)
    session_2_passed = Column(Boolean, default=False)
    session_3_passed = Column(Boolean, default=False)
    session_4_passed = Column(Boolean, default=False)

    predicted_success = Column(Float)

    direction_id = Column(Integer, ForeignKey("directions.id" , ondelete='CASCADE'), nullable=False)
    direction = relationship(Direction, back_populates="students")
    prediction = relationship(Prediction, back_populates="student")
