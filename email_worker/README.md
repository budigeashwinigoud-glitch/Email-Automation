# Email Automation Worker

This module handles automated email notifications for the Task Allotment System.

## Purpose

The email worker checks the backend for pending tasks, sends task details to the assigned employee through email, and updates the task status to `sent`.

## Workflow

1. Backend stores a newly created task with `pending` status.
2. Email worker checks for pending tasks.
3. Worker gets the assigned employee's email.
4. Worker sends the task details through Gmail SMTP.
5. Worker updates the task status to `sent`.
6. The scheduler continues checking for new pending tasks.

## Technologies

- Python
- APScheduler
- HTTPX
- SMTP
- Gmail
- python-dotenv
- FastAPI backend

## Setup

Install the required packages:

```bash
pip install -r requirements.txt