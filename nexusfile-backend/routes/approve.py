from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.orchestrator import orchestrator
from services import firestore_client
from models.invoice import Invoice
from models.transaction import ReconciliationResult

router = APIRouter()


class DraftRequest(BaseModel):
    case_id: str
    gstin: str
    period: str
    invoices: list[dict]
    reconciliation: list[dict]


class ApproveAndFileRequest(BaseModel):
    case_id: str
    gstin: str
    period: str
    return_type: str = "GSTR3B"
    draft: dict
    approved: bool


@router.post("/draft")
def create_draft(req: DraftRequest):
    """Generates a return draft for the user to review before filing."""
    # The Drafting Agent expects Invoice / ReconciliationResult objects
    # (attribute access like inv.subtotal), not raw JSON dicts — convert
    # here since the request body arrives as plain dicts.
    invoice_objs = [Invoice(**inv) for inv in req.invoices]
    reconciliation_objs = [ReconciliationResult(**r) for r in req.reconciliation]

    draft = orchestrator.draft_return(req.gstin, req.period, invoice_objs, reconciliation_objs)
    firestore_client.update_case_stage(req.case_id, "awaiting_approval")
    return {"draft": draft}


@router.post("/approve")
def approve_and_file(req: ApproveAndFileRequest):
    """
    The only route that triggers a real filing call. `approved` must
    be explicitly true — this is the human-in-the-loop gate.
    """
    if not req.approved:
        raise HTTPException(status_code=400, detail="Filing requires explicit approval=true")

    result = orchestrator.file_return(req.case_id, req.gstin, req.period, req.return_type, req.draft)
    return result
