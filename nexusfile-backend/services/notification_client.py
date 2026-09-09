"""
Sends email and SMS notifications to the business once a return is filed.

Mock mode (default, USE_MOCK_NOTIFICATIONS=true) logs exactly what would
be sent without needing real credentials — safe for demos. Flip to
false once you've configured real SMTP and an SMS provider.

Email uses plain SMTP (works with Gmail App Passwords, SendGrid SMTP
relay, etc.) so no extra Python package is needed beyond the standard
library. SMS is written against a generic REST API shape (matches
Twilio, MSG91, and most Indian SMS gateways closely enough that only
the URL/payload keys need adjusting for your specific provider).
"""
import smtplib
import requests
from email.mime.text import MIMEText
from config import settings


def send_email(to_email: str, subject: str, body: str) -> dict:
    if settings.USE_MOCK_NOTIFICATIONS:
        print(f"[MOCK EMAIL] To: {to_email} | Subject: {subject}\n{body}\n")
        return {"status": "mock_sent", "channel": "email", "to": to_email}

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM, [to_email], msg.as_string())

    return {"status": "sent", "channel": "email", "to": to_email}


def send_sms(to_phone: str, message: str) -> dict:
    if settings.USE_MOCK_NOTIFICATIONS:
        print(f"[MOCK SMS] To: {to_phone} | {message}\n")
        return {"status": "mock_sent", "channel": "sms", "to": to_phone}

    # Generic REST shape — adjust payload keys to match your actual
    # provider (Twilio, MSG91, etc.) once you have real credentials.
    resp = requests.post(
        settings.SMS_API_URL,
        headers={"Authorization": f"Bearer {settings.SMS_API_KEY}"},
        json={"to": to_phone, "sender_id": settings.SMS_SENDER_ID, "message": message},
        timeout=15,
    )
    resp.raise_for_status()
    return {"status": "sent", "channel": "sms", "to": to_phone, "response": resp.json()}
