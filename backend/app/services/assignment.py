from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models import Employee, RoundRobinState


def get_next_round_robin_employee(db: Session, department: Optional[str] = None) -> Employee:
    """
    Selects the next active employee using a persistent, deterministic round-robin strategy.
    Supports optional per-department round-robin assignment.

    - Works with any dynamic number of active employees.
    - Persists the sequence in the database so restarts do not reset state.
    - Seamlessly skips inactive employees.
    - Integrates newly created employees into future rounds.
    - Raises HTTPException(400) if no active employees are available.
    """
    query = db.query(Employee).filter(Employee.active == True)
    if department:
        query = query.filter(Employee.department == department)

    active_employees = query.order_by(Employee.id.asc()).all()

    if not active_employees:
        msg = f"No active employees available in department '{department}'." if department else "No active employees available for automatic assignment."
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )

    active_ids = [emp.id for emp in active_employees]

    state_query = db.query(RoundRobinState)
    if department:
        state = state_query.filter(RoundRobinState.department == department).first()
    else:
        state = state_query.filter(RoundRobinState.department.is_(None)).first()

    if not state:
        state = RoundRobinState(department=department, last_assigned_employee_id=None)
        db.add(state)
        db.flush()

    last_id = state.last_assigned_employee_id

    if last_id is None:
        chosen_employee = active_employees[0]
    elif last_id in active_ids:
        current_index = active_ids.index(last_id)
        next_index = (current_index + 1) % len(active_ids)
        chosen_employee = active_employees[next_index]
    else:
        # The previously assigned employee was deactivated or removed.
        # Find the next employee whose ID is greater than last_id.
        subsequent = [emp for emp in active_employees if emp.id > last_id]
        if subsequent:
            chosen_employee = subsequent[0]
        else:
            chosen_employee = active_employees[0]

    state.last_assigned_employee_id = chosen_employee.id
    db.commit()

    return chosen_employee

