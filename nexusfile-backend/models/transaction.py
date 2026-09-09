from pydantic import BaseModel
from typing import Optional


class BankTransaction(BaseModel):
    transaction_id: Optional[str] = None
    date: str
    description: str
    amount: float
    matched_invoice_id: Optional[str] = None  # set by Reconciliation Agent


class ReconciliationResult(BaseModel):
    invoice_id: str
    status: str  # "matched" | "mismatched" | "missing_in_gstr2b"
    expected_amount: float
    actual_amount: Optional[float] = None
    difference: Optional[float] = None
    notes: Optional[str] = None
