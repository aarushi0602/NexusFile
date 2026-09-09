"""
Return Drafting Agent: assembles a GSTR-1/3B-shaped draft from the
reconciled invoice data. Day 6 build target.
"""
from models.invoice import Invoice
from models.transaction import ReconciliationResult


class DraftingAgent:
    name = "drafting_agent"

    def run(self, gstin: str, period: str, invoices: list[Invoice],
             reconciliation: list[ReconciliationResult]) -> dict:
        """
        Returns a dict shaped roughly like a GSTR-3B summary payload.
        Check WhiteBooks' filing API docs for their exact expected schema
        before Day 7 — this is a reasonable approximation of the standard
        GSTN structure to start from.
        """
        matched = [r for r in reconciliation if r.status == "matched"]
        eligible_itc = sum(
            inv.tax_amount for inv in invoices
            if inv.invoice_id in {r.invoice_id for r in matched}
        )

        total_taxable_value = sum(inv.subtotal for inv in invoices)
        total_tax = sum(inv.tax_amount for inv in invoices)

        draft = {
            "gstin": gstin,
            "period": period,
            "return_type": "GSTR3B",
            "summary": {
                "total_taxable_value": round(total_taxable_value, 2),
                "total_tax_payable": round(total_tax, 2),
                "eligible_itc": round(eligible_itc, 2),
                "net_tax_liability": round(total_tax - eligible_itc, 2),
            },
            "flagged_for_review": [
                r.model_dump() for r in reconciliation if r.status != "matched"
            ],
            "invoice_count": len(invoices),
        }
        return draft
