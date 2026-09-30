import imaplib
import smtplib
from email import policy
from email.parser import BytesParser
from email.message import EmailMessage
from typing import Any, Dict, List

from config import (
    IMAP_FOLDER,
    IMAP_HOST,
    IMAP_PORT,
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USERNAME,
)


def _validate_smtp_credentials() -> None:
    if not SMTP_HOST or not SMTP_USERNAME or not SMTP_PASSWORD:
        raise ValueError("SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD must be configured.")


def _validate_imap_credentials() -> None:
    if not IMAP_HOST or not SMTP_USERNAME or not SMTP_PASSWORD:
        raise ValueError("IMAP_HOST, SMTP_USERNAME, and SMTP_PASSWORD must be configured.")


def send_email(to_email: str, subject: str, body: str, from_name: str = SMTP_FROM_NAME) -> Dict[str, Any]:
    """Send an email using Gmail/SMTP over TLS."""
    _validate_smtp_credentials()

    message = EmailMessage()
    sender = SMTP_FROM_EMAIL or SMTP_USERNAME
    message["From"] = f"{from_name} <{sender}>"
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
        if SMTP_PORT == 587:
            server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(message)

    return {"status": "sent", "to": to_email, "subject": subject}


def _extract_body(message: Any) -> str:
    if message.is_multipart():
        for part in message.walk():
            if part.get_content_type() == "text/plain":
                payload = part.get_payload(decode=True)
                if payload:
                    return payload.decode(part.get_content_charset() or "utf-8", errors="replace")
        for part in message.walk():
            if part.get_content_type() == "text/html":
                payload = part.get_payload(decode=True)
                if payload:
                    return payload.decode(part.get_content_charset() or "utf-8", errors="replace")
        return ""

    payload = message.get_payload(decode=True)
    if payload:
        return payload.decode(message.get_content_charset() or "utf-8", errors="replace")
    return ""


def read_inbox_messages(limit: int = 10, unread_only: bool = True) -> List[Dict[str, str]]:
    """Read recent messages from Gmail IMAP and return a simplified metadata/body list."""
    _validate_imap_credentials()

    mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
    try:
        mail.login(SMTP_USERNAME, SMTP_PASSWORD)
        mail.select(IMAP_FOLDER)

        criteria = "UNSEEN" if unread_only else "ALL"
        status, data = mail.search(None, criteria)
        if status != "OK":
            return []

        message_ids = data[0].split()
        message_ids = message_ids[-limit:] if limit > 0 else []
        messages: List[Dict[str, str]] = []

        for msg_id in message_ids:
            status, msg_data = mail.fetch(msg_id, "(RFC822)")
            if status != "OK" or not msg_data or not msg_data[0]:
                continue

            raw_email = msg_data[0][1]
            email_message = BytesParser(policy=policy.default).parsebytes(raw_email)
            messages.append(
                {
                    "id": msg_id.decode("utf-8"),
                    "subject": email_message.get("Subject", ""),
                    "from": email_message.get("From", ""),
                    "to": email_message.get("To", ""),
                    "date": email_message.get("Date", ""),
                    "body": _extract_body(email_message),
                }
            )

        return messages
    finally:
        try:
            mail.close()
        except Exception:
            pass
        mail.logout()


def read_unread_mail(limit: int = 10) -> List[Dict[str, str]]:
    return read_inbox_messages(limit=limit, unread_only=True)
