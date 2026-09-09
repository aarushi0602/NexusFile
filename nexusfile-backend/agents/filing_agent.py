"""
Filing Agent: submits the approved draft via the GSP sandbox. NEVER
calls this without an explicit prior approval step from the user —
the /approve route is the only caller that should reach this agent.
"""
import uuid
import random
from config import settings
from services import whitebooks_client, firestore_client


class FilingAgent:
    name = "filing_agent"

    def run(self, case_id: str, gstin: str, period: str, return_type: str, draft: dict) -> dict:
        if settings.USE_MOCK_FILING:
            result = self._mock_file(gstin, period, return_type, draft)
        else:
            result = whitebooks_client.file_return(gstin, period, return_type, draft)

        ack_number = result.get("acknowledgement_number") or result.get("ack_no")
        firestore_client.update_case_stage(
            case_id, "filed", {"acknowledgement_number": ack_number}
        )
        firestore_client.log_audit_event(
            case_id, "return_filed",
            {"return_type": return_type, "acknowledgement_number": ack_number,
             "mode": "mock" if settings.USE_MOCK_FILING else "live"},
        )
        return {"acknowledgement_number": ack_number, "raw_response": result}

    def _mock_file(self, gstin: str, period: str, return_type: str, draft: dict) -> dict:
        """
        Simulates a GSP filing response with a realistic-looking
        acknowledgement number, so the full lifecycle (draft -> approve
        -> file -> track) can be demoed reliably while the live
        WhiteBooks filing endpoint/response shape is being confirmed.
        """
        print(f"[INFO] Using mock filing (USE_MOCK_FILING=true) for {return_type} {period}")
        ack_number = f"AA{period}{random.randint(1000000, 9999999)}"
        return {
            "acknowledgement_number": ack_number,
            "status": "FILED",
            "gstin": gstin,
            "period": period,
            "return_type": return_type,
            "filed_reference_id": str(uuid.uuid4()),
        }
