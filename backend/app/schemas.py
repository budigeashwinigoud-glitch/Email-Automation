from datetime import date, datetime
from typing import Optional, List, Union, Any, Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


# -------------------------------------------------------------
# Employee Schemas
# -------------------------------------------------------------
class EmployeeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Employee name cannot be empty or blank")
        return stripped


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            if not stripped:
                raise ValueError("Employee name cannot be empty or blank")
            return stripped
        return v


class EmployeeBrief(BaseModel):
    id: int
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class EmployeeResponse(BaseModel):
    id: int
    name: str
    email: str
    active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Task Schemas
# -------------------------------------------------------------
PriorityType = Literal["Low", "Medium", "High"]
StatusType = Literal["pending", "sent", "done"]


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    priority: PriorityType
    due_date: date
    assignee: Union[int, Literal["auto"], str] = Field(..., description="'auto' or employee ID")

    @field_validator("title", "description")
    @classmethod
    def text_must_not_be_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Field cannot be empty or blank")
        return stripped

    @field_validator("assignee")
    @classmethod
    def validate_assignee(cls, v: Union[int, str]) -> Union[int, str]:
        if isinstance(v, str):
            if v.strip().lower() == "auto":
                return "auto"
            try:
                return int(v)
            except ValueError:
                raise ValueError("Assignee must be 'auto' or a valid integer employee ID")
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    priority: Optional[PriorityType] = None
    due_date: Optional[date] = None
    assignee: Optional[int] = None
    status: Optional[StatusType] = None

    @field_validator("title", "description")
    @classmethod
    def text_must_not_be_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            if not stripped:
                raise ValueError("Field cannot be empty or blank")
            return stripped
        return v


class TaskStatusUpdate(BaseModel):
    status: StatusType


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    priority: str
    due_date: date
    assigned_to: EmployeeBrief
    status: str
    created_at: datetime
    sent_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def transform_assigned_to(cls, data: Any) -> Any:
        if hasattr(data, "assigned_employee"):
            emp = data.assigned_employee
            return {
                "id": data.id,
                "title": data.title,
                "description": data.description,
                "priority": data.priority,
                "due_date": data.due_date,
                "assigned_to": {
                    "id": emp.id,
                    "name": emp.name,
                    "email": emp.email,
                } if emp else None,
                "status": data.status,
                "created_at": data.created_at,
                "sent_at": data.sent_at,
                "completed_at": data.completed_at,
            }
        return data


# -------------------------------------------------------------
# Dashboard Statistics Schemas
# -------------------------------------------------------------
class EmployeeTaskStat(BaseModel):
    employee_id: int
    employee_name: str
    pending: int
    sent: int
    done: int


class DashboardStatsResponse(BaseModel):
    total_tasks: int
    pending_tasks: int
    sent_tasks: int
    completed_tasks: int
    active_employees: int
    employee_stats: List[EmployeeTaskStat]
