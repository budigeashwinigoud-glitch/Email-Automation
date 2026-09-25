from sqlalchemy.orm import Session
from .config import settings
from .models import Employee


def seed_initial_data(db: Session) -> None:
    """
    Seeds initial employees if the Employee table is empty.
    Seed data is completely configurable via settings / environment.
    """
    if not settings.SEED_INITIAL_EMPLOYEES:
        return

    existing_count = db.query(Employee).count()
    if existing_count == 0:
        for emp_data in settings.INITIAL_EMPLOYEES:
            emp = Employee(
                name=emp_data["name"],
                email=emp_data["email"],
                active=True
            )
            db.add(emp)
        db.commit()
