"""
Central config loader. Every other module pulls settings from here
instead of calling os.getenv() directly, so there is one place to
check when something is misconfigured.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # GCP
    GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "")
    GCP_LOCATION = os.getenv("GCP_LOCATION", "asia-south1")
    GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "")
    BIGQUERY_DATASET = os.getenv("BIGQUERY_DATASET", "nexusfile")

    # Document AI
    DOCAI_PROCESSOR_ID = os.getenv("DOCAI_PROCESSOR_ID", "")
    DOCAI_LOCATION = os.getenv("DOCAI_LOCATION", "us")

    # Gemini
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

    # WhiteBooks (OAuth2: client_id + client_secret, not a single API key)
    WHITEBOOKS_CLIENT_ID = os.getenv("WHITEBOOKS_CLIENT_ID", "")
    WHITEBOOKS_CLIENT_SECRET = os.getenv("WHITEBOOKS_CLIENT_SECRET", "")
    WHITEBOOKS_BASE_URL = os.getenv("WHITEBOOKS_BASE_URL", "")

    # Set to "true" to reconcile against the mock fixture instead of the
    # live WhiteBooks sandbox.
    USE_MOCK_GSTR2B = os.getenv("USE_MOCK_GSTR2B", "true").lower() == "true"
    MOCK_GSTR2B_PATH = os.getenv("MOCK_GSTR2B_PATH", "data/gstr2b_mock.json")

    # Set to "true" to simulate filing instead of calling the live GSP
    # sandbox — use this for reliable demos while WhiteBooks' real filing
    # response schema is being confirmed.
    USE_MOCK_FILING = os.getenv("USE_MOCK_FILING", "true").lower() == "true"

    # Notifications (email + SMS) sent to the business once filing completes.
    # Mock mode logs what WOULD be sent without needing real SMTP/SMS
    # credentials — flip to false once you have a real provider configured.
    USE_MOCK_NOTIFICATIONS = os.getenv("USE_MOCK_NOTIFICATIONS", "true").lower() == "true"

    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM = os.getenv("SMTP_FROM", "noreply@nexusfile.app")

    # SMS via any provider with a similar REST API (Twilio, MSG91, etc.)
    SMS_API_KEY = os.getenv("SMS_API_KEY", "")
    SMS_API_URL = os.getenv("SMS_API_URL", "")
    SMS_SENDER_ID = os.getenv("SMS_SENDER_ID", "NEXUSF")

    # Sandbox.co.in
    SANDBOX_API_KEY = os.getenv("SANDBOX_API_KEY", "")
    SANDBOX_BASE_URL = os.getenv("SANDBOX_BASE_URL", "")

    def missing_keys(self):
        """Returns a list of required settings that are still blank,
        so /health can tell you exactly what's not configured yet."""
        required = {
            "GCP_PROJECT_ID": self.GCP_PROJECT_ID,
            "GCS_BUCKET_NAME": self.GCS_BUCKET_NAME,
            "GEMINI_API_KEY": self.GEMINI_API_KEY,
        }
        return [k for k, v in required.items() if not v]


settings = Settings()
