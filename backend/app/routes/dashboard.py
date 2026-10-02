from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import case, func

from ..database import get_db
from ..models import Task, Employee
from ..schemas import DashboardStatsResponse, EmployeeTaskStat

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Retrieve live dashboard statistics computed directly from the database.
    """
    total_tasks, pending_tasks, sent_tasks, completed_tasks = db.query(
        func.count(Task.id),
        func.coalesce(func.sum(case((Task.status == "pending", 1), else_=0)), 0),
        func.coalesce(func.sum(case((Task.status == "sent", 1), else_=0)), 0),
        func.coalesce(func.sum(case((Task.status == "done", 1), else_=0)), 0),
    ).one()

    # Aggregate per-employee task counts in one query to avoid remote N+1 queries.
    employee_rows = (
        db.query(
            Employee.id.label("employee_id"),
            Employee.name.label("employee_name"),
            Employee.department.label("department"),
            Employee.active.label("active"),
            func.coalesce(func.sum(case((Task.status == "pending", 1), else_=0)), 0).label("pending"),
            func.coalesce(func.sum(case((Task.status == "sent", 1), else_=0)), 0).label("sent"),
            func.coalesce(func.sum(case((Task.status == "done", 1), else_=0)), 0).label("done"),
        )
        .outerjoin(Task, Task.assigned_to == Employee.id)
        .group_by(Employee.id, Employee.name, Employee.department, Employee.active)
        .order_by(Employee.name.asc())
        .all()
    )
    active_employees = sum(1 for employee in employee_rows if employee.active)
    employee_stats: List[EmployeeTaskStat] = [
        EmployeeTaskStat(
            employee_id=employee.employee_id,
            employee_name=employee.employee_name,
            department=employee.department,
            pending=employee.pending,
            sent=employee.sent,
            done=employee.done,
        )
        for employee in employee_rows
    ]

    return DashboardStatsResponse(
        total_tasks=total_tasks,
        pending_tasks=pending_tasks,
        sent_tasks=sent_tasks,
        completed_tasks=completed_tasks,
        active_employees=active_employees,
        employee_stats=employee_stats
    )
