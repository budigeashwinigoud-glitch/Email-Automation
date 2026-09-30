import httpx
from apscheduler.schedulers.blocking import BlockingScheduler

from config import BACKEND_URL
from email_service import read_unread_mail, send_email


def process_pending_tasks():
    print("Checking for pending tasks...")

    response = httpx.get(
        f"{BACKEND_URL}/api/tasks/pending",
        timeout=10
    )

    response.raise_for_status()

    tasks = response.json()

    if not tasks:
        print("No pending tasks found.")
        return

    for task in tasks:
        employee = task["assigned_to"]

        subject = f"New Task: {task['title']}"

        body = f"""
Hello {employee['name']},

You have been assigned a new task.

Task: {task['title']}
Description: {task['description']}
Priority: {task['priority']}
Due Date: {task['due_date']}

Please complete the task by the due date.

Regards,
Task Automation System
"""

        send_email(employee["email"], subject, body)

        update_response = httpx.patch(
            f"{BACKEND_URL}/api/tasks/{task['id']}/status",
            json={"status": "sent"},
            timeout=10
        )

        update_response.raise_for_status()

        print(f"Task {task['id']} marked as sent.")


def read_mail_access_demo(limit: int = 5):
    """Read the most recent unread messages from the configured inbox."""
    messages = read_unread_mail(limit=limit)
    print(f"Found {len(messages)} unread message(s).")
    return messages


scheduler = BlockingScheduler()

scheduler.add_job(
    process_pending_tasks,
    "interval",
    minutes=1
)

print("Email automation worker started.")
print("Checking for pending tasks every 1 minute...")

process_pending_tasks()

scheduler.start()