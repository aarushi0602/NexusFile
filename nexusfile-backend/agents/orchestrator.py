"""
Orchestrator: coordinates the agent pipeline end to end.

This is written as a plain Python coordinator so it runs today without
any extra SDK setup. Once you've confirmed Google ADK's exact install/
API surface in your environment, swap this class's internals to use
ADK's agent/tool registration pattern (root agent + sub-agents) while
keeping this same call signatures — your routes won't need to change.
"""
from agents.ingestion_agent import IngestionAgent
from agents.classification_agent import ClassificationAgent
from agents.reconciliation_agent import ReconciliationAgent
from agents.drafting_agent import DraftingAgent
from agents.filing_agent import FilingAgent
from agents.notification_agent import NotificationAgent
from services import firestore_client, bigquery_client
from models.invoice import Invoice
import uuid


class Orchestrator:
    def __init__(self):
        self.ingestion = IngestionAgent()
        self.classification = ClassificationAgent()
        self.reconciliation = ReconciliationAgent()
        self.drafting = DraftingAgent()
        self.filing = FilingAgent()
        self.notification = NotificationAgent()

    def start_case(self, profile: dict | None = None) -> str:
        case_id = str(uuid.uuid4())
        case_data = {
            "case_id": case_id,
            "stage": "created",
            "invoice_count": 0,
            "mismatch_count": 0,
        }
        if profile:
            case_data["profile"] = profile
        firestore_client.create_case(case_id, case_data)
        return case_id

    def ingest_and_classify(self, case_id: str, files: list[tuple]) -> list[Invoice]:
        """files: list of (file_bytes, filename, mime_type) tuples"""
        invoices = []
        for file_bytes, filename, mime_type in files:
            invoice = self.ingestion.run(case_id, file_bytes, filename, mime_type)
            invoice = self.classification.run(invoice)
            invoices.append(invoice)

        try:
            bigquery_client.insert_rows(
                "invoices",
                [dict(**inv.model_dump(exclude={"line_items"}), case_id=case_id) for inv in invoices],
            )
            firestore_client.update_case_stage(
                case_id, "classified", {"invoice_count": len(invoices)}
            )
        except Exception as e:
            print(f"[WARN] Failed to insert invoices to BigQuery or update Firestore: {e}")
        return invoices

    def reconcile(self, case_id: str, gstin: str, period: str, invoices: list[Invoice]):
        return self.reconciliation.run(case_id, gstin, period, invoices)

    def draft_return(self, gstin: str, period: str, invoices, reconciliation):
        return self.drafting.run(gstin, period, invoices, reconciliation)

    def file_return(self, case_id: str, gstin: str, period: str, return_type: str, draft: dict):
        """Only call after the user has explicitly approved the draft."""
        result = self.filing.run(case_id, gstin, period, return_type, draft)

        # Close the loop: tell the business it's done. Look up their
        # profile (saved at case creation) to know where to send it.
        case = firestore_client.get_case(case_id)
        profile = (case or {}).get("profile")
        if profile:
            notification_result = self.notification.run(
                case_id, profile,
                result.get("acknowledgement_number"),
                draft["summary"]["net_tax_liability"],
            )
            result["notifications"] = notification_result

        return result


orchestrator = Orchestrator()
