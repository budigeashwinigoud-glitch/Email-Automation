from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Employee, Task, RoundRobinState
from ..schemas import EmployeeCreate, EmployeeUpdate, EmployeeResponse

router = APIRouter(prefix="/api/employees", tags=["Employees"])


@router.get("", response_model=List[EmployeeResponse])
def get_employees(
    active: Optional[bool] = Query(None, description="Filter by active status"),
    department: Optional[str] = Query(None, description="Filter by department"),
    db: Session = Depends(get_db)
):
    """
    Retrieve all employees with optional active status and department filtering.
    """
    query = db.query(Employee)
    if active is not None:
        query = query.filter(Employee.active == active)
    if department:
        query = query.filter(Employee.department == department)
    return query.order_by(Employee.id.asc()).all()


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new employee. Active by default.
    """
    # Check duplicate email
    existing = db.query(Employee).filter(Employee.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An employee with this email already exists."
        )

    employee = Employee(
        name=payload.name,
        email=payload.email,
        department=payload.department,
        active=True
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve an employee by ID.
    """
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found."
        )
    return employee


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db)
):
    """
    Update employee details (name, email, active status).
    """
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found."
        )

    if payload.email is not None and payload.email != employee.email:
        # Check duplicate email
        duplicate = db.query(Employee).filter(
            Employee.email == payload.email,
            Employee.id != employee_id
        ).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An employee with this email already exists."
            )
        employee.email = payload.email

    if payload.name is not None:
        employee.name = payload.name

    if payload.department is not None:
        employee.department = payload.department

    if payload.active is not None:
        employee.active = payload.active

    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/{employee_id}")
def delete_or_deactivate_employee(
    employee_id: int,
    permanent: bool = Query(False, description="Set to true to permanently delete employee and associated tasks"),
    db: Session = Depends(get_db)
):
    """
    Delete or deactivate an employee.
    - If permanent=True: permanently removes the employee from the database, deletes their assigned tasks,
      and cleans up any round-robin state referencing them.
    - If permanent=False: soft-deactivates the employee (active = false) to preserve historical task records.
    """
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found."
        )

    if permanent:
        # Reset last_assigned_employee_id in round_robin_state if referencing this employee
        db.query(RoundRobinState).filter(RoundRobinState.last_assigned_employee_id == employee_id).update(
            {"last_assigned_employee_id": None}
        )
        # Delete associated tasks
        db.query(Task).filter(Task.assigned_to == employee_id).delete()
        # Delete the employee
        db.delete(employee)
        db.commit()
        return {
            "message": "Employee and associated tasks deleted successfully.",
            "id": employee_id,
            "deleted": True
        }
    else:
        employee.active = False
        db.commit()
        return {
            "message": "Employee deactivated successfully.",
            "id": employee.id,
            "active": False
        }
