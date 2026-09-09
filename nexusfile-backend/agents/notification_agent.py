"""
Notification Agent: tells the business their return has been filed,
by email. This is the agent that makes the loop feel closed — without
it, a business has no way of knowing the work actually happened,
which defeats the point of automating it.
"""
from services import notification_client, firestore_client


class NotificationAgent:
    name = "notification_agent"

    def run(self, case_id: str, profile: dict, ack_number: str, net_tax_liability: float) -> dict:
        subject = "Your GST return has been filed — NexusFile"
        body = (
            f"Hi {profile.get('business_name', 'there')},\n\n"
            f"Your GSTR-3B return has been filed successfully.\n\n"
            f"Acknowledgement number: {ack_number}\n"
            f"Net tax liability: \u20b9{net_tax_liability:,.2f}\n\n"
            f"You can track this filing and any follow-up notices in your NexusFile dashboard.\n\n"
            f"— NexusFile"
        )

        results = {}

        email = profile.get("email")
        if email:
            try:
                results["email"] = notification_client.send_email(email, subject, body)
            except Exception as e:
                results["email"] = {"status": "failed", "error": str(e)}

        firestore_client.log_audit_event(case_id, "notifications_sent", results)
        return results
