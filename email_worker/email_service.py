import smtplib
from email.message import EmailMessage

from config import SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD


def send_email(to_email, subject, body):
    message = EmailMessage()

    message["From"] = SMTP_USERNAME
    message["To"] = to_email
    message["Subject"] = subject

    message.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(message)

    print(f"Email sent successfully to {to_email}")