# Email Automation Worker

This module handles automated email notifications for the Task Allotment System.

## Purpose

The email worker checks the backend for pending tasks, sends task details to the assigned employee through email, and can also read recent mail from the configured inbox.

## Workflow

1. Backend stores a newly created task with `pending` status.
2. Email worker checks for pending tasks.
3. Worker gets the assigned employee's email.
4. Worker sends the task details through Gmail SMTP.
5. Worker updates the task status to `sent`.
6. The worker can also read unread messages from Gmail IMAP for mail monitoring or reply handling.

## Technologies

- Python
- APScheduler
- HTTPX
- SMTP
- IMAP
- Gmail
- python-dotenv
- FastAPI backend

## Gmail setup

1. Enable IMAP in your Gmail account.
2. Create an App Password if 2FA is enabled.
3. Add the following environment variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM_NAME=Belvo HR Task Automation
SMTP_FROM_EMAIL=your-email@gmail.com

IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_FOLDER=INBOX
BACKEND_URL=http://127.0.0.1:8000
```

## Usage

```bash
pip install -r requirements.txt
python worker.py
```

The worker sends pending-task emails and exposes read access via `read_unread_mail()` in `email_service.py`.