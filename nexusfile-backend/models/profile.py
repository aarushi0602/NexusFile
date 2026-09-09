from pydantic import BaseModel, Field
from typing import Optional


class BusinessProfile(BaseModel):
    business_name: str
    email: str
    phone: str = Field(..., description="Include country code, e.g. +919876543210")
    pan: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
