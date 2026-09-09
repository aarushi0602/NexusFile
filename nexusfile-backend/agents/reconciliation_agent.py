"""
Reconciliation Agent: fetches GSTR-2B (from the GSP sandbox, or a local
mock fixture) and diffs it against the user's own invoice ledger,
flagging mismatches and missing Input Tax Credit claims.
"""
import json
from services import whitebooks_client, bigquery_client, firestore_client
from config import settings
from models.invoice import Invoice
from models.transaction import ReconciliationResult

AMOUNT_TOLERANCE = 1.0  # rupees; treat differences smaller than this as a match


class ReconciliationAgent:
    name = "reconciliation_agent"

    def run(self, case_id: str, gstin: str, period: str, invoices: list[Invoice]) -> list[ReconciliationResult]:
        gstr2b_data = self._fetch_gstr2b(gstin, period)

        gstr2b_invoices = {
            inv.get("invoice_number"): inv.get("total_amount", 0.0)
            for inv in gstr2b_data.get("invoices", [])
        }

        results = []
        for invoice in invoices:
            gstr2b_amount = gstr2b_invoices.get(invoice.invoice_number)

            if gstr2b_amount is None:
                result = ReconciliationResult(
                    invoice_id=invoice.invoice_id,
                    status="missing_in_gstr2b",
                    expected_amount=invoice.total_amount,
                    notes="Supplier has not reported this invoice — ITC at risk.",
                )
            elif abs(gstr2b_amount - invoice.total_amount) > AMOUNT_TOLERANCE:
                result = ReconciliationResult(
                    invoice_id=invoice.invoice_id,
                    status="mismatched",
                    expected_amount=invoice.total_amount,
                    actual_amount=gstr2b_amount,
                    difference=round(invoice.total_amount - gstr2b_amount, 2),
                    notes="Amount reported by supplier differs from your ledger.",
                )
            else:
                result = ReconciliationResult(
                    invoice_id=invoice.invoice_id,
                    status="matched",
                    expected_amount=invoice.total_amount,
                    actual_amount=gstr2b_amount,
                    difference=0.0,
                )
            results.append(result)

        try:
            bigquery_client.insert_rows(
                "reconciliation_results",
                [dict(**r.model_dump(), case_id=case_id) for r in results],
            )
        except Exception as e:
            print(f"[WARN] Failed to insert reconciliation results to BigQuery: {e}")

        try:
            mismatch_count = sum(1 for r in results if r.status != "matched")
            firestore_client.update_case_stage(
                case_id, "reconciled", {"mismatch_count": mismatch_count}
            )
        except Exception as e:
            print(f"[WARN] Failed to update case stage in Firestore: {e}")
        return results

    def _fetch_gstr2b(self, gstin: str, period: str) -> dict:
        if settings.USE_MOCK_GSTR2B:
            print(f"[INFO] Using mock GSTR-2B fixture (USE_MOCK_GSTR2B=true) "
                  f"from {settings.MOCK_GSTR2B_PATH}")
            with open(settings.MOCK_GSTR2B_PATH, "r") as f:
                return json.load(f)
        return whitebooks_client.fetch_gstr2b(gstin, period)
