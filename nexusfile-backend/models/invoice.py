from pydantic import BaseModel
from typing import Optional


class LineItem(BaseModel):
    description: str
    hsn_code: Optional[str] = None
    quantity: float = 1.0
    unit_price: float = 0.0
    tax_rate: float = 0.0  # e.g. 18.0 for 18%
    line_total: float = 0.0


class Invoice(BaseModel):
    invoice_id: Optional[str] = None
    vendor_name: str
    vendor_gstin: Optional[str] = None
    invoice_number: str
    invoice_date: str  # ISO format string, e.g. "2026-08-15"
    line_items: list[LineItem] = []
    subtotal: float = 0.0
    tax_amount: float = 0.0
    total_amount: float = 0.0
    category: Optional[str] = None       # filled in by Classification Agent
    is_b2b: Optional[bool] = None
    source_file: Optional[str] = None    # GCS path to original upload
