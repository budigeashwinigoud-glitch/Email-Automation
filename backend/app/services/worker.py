import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session, joinedload

from ..config import settings
from ..models import Task, Employee
from .email import send_task_email, is_email_service_configured

logger = logging.getLogger("belvo.email_worker")


def process_pending_tasks(db: Session) -> Dict[str, Any]:
    """
    Processes all pending tasks waiting for email delivery.

    Workflow:
    1. Checks if email service is configured. If not configured, logs a clear warning
       and leaves all pending tasks in 'pending' status (never fakes delivery).
    2. Retrieves all tasks with status == 'pending' ordered chronologically.
    3. For each pending task:
       a. Verifies employee assignment and recipient email address.
       b. Delivers email via configured SMTP provider.
       c. On successful delivery: updates task status to 'sent' and records 'sent_at'.
       d. On failure: leaves task in 'pending' status and logs error.
    4. One failed task does not block other pending tasks from being processed.
    5. Returns execution statistics.
    """
    if not is_email_service_configured():
        logger.info(
            "Email worker: Email provider is not configured. "
            "Pending tasks will remain pending until SMTP credentials are provided."
        )
        return {
            "status": "unconfigured",
            "message": "Email provider is not configured. Pending tasks remain pending.",
            "processed": 0,
            "sent": 0,
            "failed": 0,
            "skipped": 0,
        }

    pending_tasks: List[Task] = (
        db.query(Task)
        .options(joinedload(Task.assigned_employee))
        .filter(Task.status == "pending")
        .order_by(Task.created_at.asc(), Task.id.asc())
        .all()
    )

    if not pending_tasks:
        return {
            "status": "success",
            "message": "No pending tasks to dispatch.",
            "processed": 0,
            "sent": 0,
            "failed": 0,
            "skipped": 0,
        }

    processed_count = 0
    sent_count = 0
    failed_count = 0
    skipped_count = 0

    for task in pending_tasks:
        processed_count += 1

        # Double check status hasn't changed concurrently
        if task.status != "pending":
            skipped_count += 1
            continue

        employee = task.assigned_employee
        if not employee:
            employee = db.query(Employee).filter(Employee.id == task.assigned_to).first()

        if not employee or not employee.email or not employee.email.strip():
            logger.error(
                f"Email worker: Task #{task.id} ('{task.title}') has no valid employee email. "
                "Task remains pending."
            )
            failed_count += 1
            continue

        try:
            # Deliver real email via SMTP
            send_task_email(task, employee)

            # Mark sent only after confirmed delivery
            task.status = "sent"
            task.sent_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(task)
            sent_count += 1
            logger.info(
                f"Email worker: Successfully dispatched Task #{task.id} ('{task.title}') "
                f"to {employee.name} <{employee.email}>."
            )
        except Exception as exc:
            db.rollback()
            failed_count += 1
            logger.error(
                f"Email worker: Delivery failed for Task #{task.id} to {employee.email}: {exc}. "
                "Task remains pending."
            )

    return {
        "status": "success",
        "processed": processed_count,
        "sent": sent_count,
        "failed": failed_count,
        "skipped": skipped_count,
    }
