"""
Monitoring Agent (simplified for hackathon scope): checks filing status
and, when manually triggered, drafts an escalation recommendation using
Gemini. Day 8 build target — deliberately NOT built as a real scheduled
poller for the hackathon; trigger it manually in the demo.
"""
import google.generativeai as genai
from config import settings
from services import firestore_client

genai.configure(api_key=settings.GEMINI_API_KEY)

ESCALATION_PROMPT = """A GST return was filed with acknowledgement number
{ack_number} on behalf of a business. It has now been {days_elapsed} days
with the following status update from the authority: "{status_update}".

Based on this, write a short, plain-English recommendation (3-4 sentences)
on whether escalation is warranted and what the next concrete step should
be. Do not invent facts not given above.
"""


class MonitoringAgent:
    name = "monitoring_agent"

    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    def check_and_recommend(self, case_id: str, ack_number: str,
                             days_elapsed: int, status_update: str) -> str:
        prompt = ESCALATION_PROMPT.format(
            ack_number=ack_number, days_elapsed=days_elapsed, status_update=status_update
        )
        response = self.model.generate_content(prompt)
        recommendation = response.text.strip()

        firestore_client.log_audit_event(
            case_id, "monitoring_check",
            {"days_elapsed": days_elapsed, "recommendation": recommendation},
        )
        return recommendation
