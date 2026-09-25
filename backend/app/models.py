from sqlalchemy import Column, Integer, String, Text, Boolean, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    tasks = relationship("Task", back_populates="assigned_employee")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False)  # "Low", "Medium", "High"
    assigned_to = Column(Integer, ForeignKey("employees.id"), nullable=False)
    status = Column(String(20), default="pending", nullable=False)  # "pending", "sent", "done"
    due_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    assigned_employee = relationship("Employee", back_populates="tasks")


class RoundRobinState(Base):
    __tablename__ = "round_robin_state"

    id = Column(Integer, primary_key=True, index=True)
    last_assigned_employee_id = Column(Integer, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
