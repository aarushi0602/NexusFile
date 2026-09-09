from fastapi import APIRouter
from pydantic import BaseModel
from agents.orchestrator import orchestrator
from models.invoice import Invoice

router = APIRouter()


class ReconcileRequest(BaseModel):
    case_id: str
    gstin: str
    period: str  # e.g. "082026"
    invoices: list[dict]


@router.post("/reconcile")
def reconcile(req: ReconcileRequest):
    """
    Runs the Reconciliation Agent: matches the given invoices against
    GSTR-2B (mock fixture or live GSP sandbox, controlled by
    USE_MOCK_GSTR2B in .env) and returns matched/mismatched/missing status
    for each one.
    """
    invoice_objs = [Invoice(**inv) for inv in req.invoices]
    results = orchestrator.reconcile(req.case_id, req.gstin, req.period, invoice_objs)
    return {"reconciliation": [r.model_dump() for r in results]}
