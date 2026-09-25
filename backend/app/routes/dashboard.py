from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Task, Employee
from ..schemas import DashboardStatsResponse, EmployeeTaskStat

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Retrieve live dashboard statistics computed directly from the database.
    """
    total_tasks = db.query(func.count(Task.id)).scalar() or 0
    pending_tasks = db.query(func.count(Task.id)).filter(Task.status == "pending").scalar() or 0
    sent_tasks = db.query(func.count(Task.id)).filter(Task.status == "sent").scalar() or 0
    completed_tasks = db.query(func.count(Task.id)).filter(Task.status == "done").scalar() or 0
    active_employees = db.query(func.count(Employee.id)).filter(Employee.active == True).scalar() or 0

    # Employee-level task counts
    employees = db.query(Employee).order_by(Employee.name.asc()).all()
    employee_stats: List[EmployeeTaskStat] = []

    for emp in employees:
        pending_count = sum(1 for t in emp.tasks if t.status == "pending")
        sent_count = sum(1 for t in emp.tasks if t.status == "sent")
        done_count = sum(1 for t in emp.tasks if t.status == "done")

        employee_stats.append(
            EmployeeTaskStat(
                employee_id=emp.id,
                employee_name=emp.name,
                department=emp.department,
                pending=pending_count,
                sent=sent_count,
                done=done_count
            )
        )

    return DashboardStatsResponse(
        total_tasks=total_tasks,
        pending_tasks=pending_tasks,
        sent_tasks=sent_tasks,
        completed_tasks=completed_tasks,
        active_employees=active_employees,
        employee_stats=employee_stats
    )
