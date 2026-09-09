from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CaseStatus(BaseModel):
    case_id: str
    stage: str = "ingested"
    # expected stages: ingested -> classified -> reconciled -> drafted ->
    # awaiting_approval -> filed -> tracking -> escalated -> resolved
    created_at: str = datetime.utcnow().isoformat()
    updated_at: str = datetime.utcnow().isoformat()
    invoice_count: int = 0
    mismatch_count: int = 0
    acknowledgement_number: Optional[str] = None
    notes: list[str] = []
