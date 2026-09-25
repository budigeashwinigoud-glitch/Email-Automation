from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Task, Employee
from ..schemas import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskResponse
from ..services.assignment import get_next_round_robin_employee

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new task with manual or automatic round-robin assignment.
    """
    if payload.assignee == "auto":
        assigned_employee = get_next_round_robin_employee(db)
    else:
        # Manual assignment to a specific employee ID
        employee = db.query(Employee).filter(Employee.id == payload.assignee).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee with ID {payload.assignee} does not exist."
            )
        if not employee.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee is inactive and cannot receive new tasks."
            )
        assigned_employee = employee

    new_task = Task(
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        assigned_to=assigned_employee.id,
        status="pending",
        due_date=payload.due_date,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    # Ensure relationship is loaded
    db.refresh(new_task, ["assigned_employee"])
    return new_task


@router.get("", response_model=List[TaskResponse])
def get_tasks(
    status: Optional[str] = Query(None, description="Filter by task status (pending, sent, done)"),
    assignee: Optional[int] = Query(None, description="Filter by assigned employee ID"),
    priority: Optional[str] = Query(None, description="Filter by priority (Low, Medium, High)"),
    db: Session = Depends(get_db)
):
    """
    Retrieve all tasks sorted by newest first, with optional filters.
    """
    query = db.query(Task).options(joinedload(Task.assigned_employee))

    if status:
        query = query.filter(Task.status == status)
    if assignee:
        query = query.filter(Task.assigned_to == assignee)
    if priority:
        query = query.filter(Task.priority == priority)

    return query.order_by(Task.created_at.desc(), Task.id.desc()).all()


@router.get("/pending", response_model=List[TaskResponse])
def get_pending_tasks(
    db: Session = Depends(get_db)
):
    """
    Integration endpoint for the future Email Automation Service.
    Retrieves all tasks with status = pending along with assigned employee details.
    """
    tasks = (
        db.query(Task)
        .options(joinedload(Task.assigned_employee))
        .filter(Task.status == "pending")
        .order_by(Task.created_at.asc(), Task.id.asc())
        .all()
    )
    return tasks


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve full details for a single task.
    """
    task = (
        db.query(Task)
        .options(joinedload(Task.assigned_employee))
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db)
):
    """
    Update task details (title, description, priority, due date, assignee, status).
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )

    if payload.assignee is not None:
        employee = db.query(Employee).filter(Employee.id == payload.assignee).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee with ID {payload.assignee} does not exist."
            )
        if not employee.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee is inactive and cannot receive new tasks."
            )
        task.assigned_to = employee.id

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.due_date is not None:
        task.due_date = payload.due_date

    if payload.status is not None:
        task.status = payload.status
        now = datetime.now(timezone.utc)
        if payload.status == "sent" and task.sent_at is None:
            task.sent_at = now
        elif payload.status == "done" and task.completed_at is None:
            task.completed_at = now

    db.commit()
    db.refresh(task)
    db.refresh(task, ["assigned_employee"])
    return task


@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update status of a task (e.g. pending -> sent, sent -> done).
    Used by the future email automation service or employee completion.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )

    task.status = payload.status
    now = datetime.now(timezone.utc)
    if payload.status == "sent" and task.sent_at is None:
        task.sent_at = now
    elif payload.status == "done" and task.completed_at is None:
        task.completed_at = now

    db.commit()
    db.refresh(task)
    db.refresh(task, ["assigned_employee"])
    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a task.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )

    db.delete(task)
    db.commit()
    return {
        "message": "Task deleted successfully.",
        "id": task_id
    }
