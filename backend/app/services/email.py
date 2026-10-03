import base64
import os

from dotenv import load_dotenv

load_dotenv()
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import Dict, Any

from fastapi import HTTPException, status

from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from ..models import Task, Employee


class EmailServiceError(Exception):
    """Base exception for email service issues."""
    pass


class EmailNotConfiguredError(EmailServiceError):
    """Raised when Gmail API credentials are not configured."""
    pass


GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send"


def is_email_service_configured() -> bool:
    """
    Check whether the Gmail API credentials required for sending
    emails are configured.
    """

    return bool(
        os.getenv("GOOGLE_CLIENT_ID", "").strip()
        and os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
        and os.getenv("GOOGLE_REFRESH_TOKEN", "").strip()
        and os.getenv("GOOGLE_SENDER_EMAIL", "").strip()
    )


def get_gmail_credentials() -> Credentials:
    """
    Create Gmail OAuth credentials using the refresh token.

    The refresh token allows the backend to obtain fresh access
    tokens without asking the user to authorize every time.
    """

    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
    refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN", "").strip()

    if not client_id or not client_secret or not refresh_token:
        raise EmailNotConfiguredError(
            "Gmail API OAuth credentials are not configured."
        )

    credentials = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=[GMAIL_SCOPE],
    )

    # Refresh the access token when required.
    if not credentials.valid:
        credentials.refresh(GoogleRequest())

    return credentials


def send_task_email(task: Task, employee: Employee) -> Dict[str, Any]:
    """
    Send a new task notification email using the Gmail API.

    The email content remains the same as the original SMTP version.
    Only the transport mechanism has changed from SMTP to Gmail API.
    """

    if not employee or not employee.email or not employee.email.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned employee does not have a valid email address.",
        )

    # Verify Gmail API configuration.
    if not is_email_service_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Email service is not configured. "
                "Please configure GOOGLE_CLIENT_ID, "
                "GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, "
                "and GOOGLE_SENDER_EMAIL."
            ),
        )

    sender_email = os.getenv("GOOGLE_SENDER_EMAIL", "").strip()
    sender_name = os.getenv(
        "SMTP_FROM_NAME",
        "Belvo HR Task Management",
    ).strip()

    recipient_email = employee.email.strip()
    recipient_name = employee.name.strip()

    subject = f"New Task Assigned: {task.title}"

    dept_name = task.department or employee.department or "General"
    due_date_str = str(task.due_date) if task.due_date else "Not specified"

    # ---------------------------------------------------------
    # Plain text version
    # ---------------------------------------------------------

    plain_text = f"""Hello {recipient_name},

You have been assigned a new task on the Belvo HR platform.

Task Details:
--------------------------------------------------
Title:       {task.title}
Department:  {dept_name}
Priority:    {task.priority}
Due Date:    {due_date_str}

Description:
{task.description}
--------------------------------------------------

Please log in to your dashboard to review and begin working on this task.

Best regards,
{sender_name}
"""

    # ---------------------------------------------------------
    # HTML version
    # ---------------------------------------------------------

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }}
    .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }}
    .header {{ background: linear-gradient(135deg, #2563eb, #1e40af); padding: 24px; color: #ffffff; }}
    .header h1 {{ margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }}
    .header p {{ margin: 0; font-size: 13px; opacity: 0.9; }}
    .body {{ padding: 24px; }}
    .task-card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 16px 0; }}
    .task-title {{ font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }}
    .badge {{ display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }}
    .badge-high {{ background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }}
    .badge-medium {{ background: #fffbeb; color: #b45309; border: 1px solid #fef3c7; }}
    .badge-low {{ background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }}
    .meta-table {{ width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }}
    .meta-table td {{ padding: 6px 0; vertical-align: top; }}
    .meta-label {{ color: #64748b; font-weight: 600; width: 120px; }}
    .meta-value {{ color: #0f172a; font-weight: 600; }}
    .desc-box {{ background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-top: 14px; font-size: 13.5px; line-height: 1.5; color: #334155; white-space: pre-wrap; }}
    .footer {{ padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Task Assigned</h1>
      <p>Belvo HR Automated Task Allotment</p>
    </div>

    <div class="body">
      <p style="margin-top: 0; font-size: 14px;">
        Hello <strong>{recipient_name}</strong>,
      </p>

      <p style="font-size: 13.5px; color: #475569;">
        You have been assigned a new task. Please review the details below:
      </p>

      <div class="task-card">
        <div class="task-title">{task.title}</div>

        <table class="meta-table">
          <tr>
            <td class="meta-label">Department:</td>
            <td class="meta-value">{dept_name}</td>
          </tr>

          <tr>
            <td class="meta-label">Priority:</td>
            <td class="meta-value">
              <span class="badge badge-{'high' if task.priority.lower() == 'high' else 'medium' if task.priority.lower() == 'medium' else 'low'}">
                {task.priority}
              </span>
            </td>
          </tr>

          <tr>
            <td class="meta-label">Due Date:</td>
            <td class="meta-value">{due_date_str}</td>
          </tr>
        </table>

        <div style="margin-top: 12px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">
          Description
        </div>

        <div class="desc-box">{task.description}</div>
      </div>

      <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
        If you have questions about this task, please reach out to your department lead.
      </p>
    </div>

    <div class="footer">
      This is an automated notification from {sender_name}.
    </div>
  </div>
</body>
</html>
"""

    # ---------------------------------------------------------
    # Build MIME email
    # ---------------------------------------------------------

    msg = MIMEMultipart("alternative")

    msg["Subject"] = subject
    msg["From"] = formataddr((sender_name, sender_email))
    msg["To"] = formataddr((recipient_name, recipient_email))

    part1 = MIMEText(
        plain_text,
        "plain",
        "utf-8",
    )

    part2 = MIMEText(
        html_content,
        "html",
        "utf-8",
    )

    msg.attach(part1)
    msg.attach(part2)

    # ---------------------------------------------------------
    # Send through Gmail API
    # ---------------------------------------------------------

    try:
        credentials = get_gmail_credentials()

        gmail_service = build(
            "gmail",
            "v1",
            credentials=credentials,
        )

        raw_message = base64.urlsafe_b64encode(
            msg.as_bytes()
        ).decode("utf-8")

        gmail_service.users().messages().send(
            userId="me",
            body={
                "raw": raw_message,
            },
        ).execute()

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                f"Failed to deliver email to "
                f"{recipient_email}: {str(exc)}"
            ),
        )

    return {
        "status": "delivered",
        "recipient": recipient_email,
        "subject": subject,
    }