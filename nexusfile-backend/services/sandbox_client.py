"""
Wraps Sandbox.co.in's public GST APIs (GSTIN search, track return).
Confirm exact paths/headers against their dashboard docs after signup.
"""
import requests
from config import settings


def _headers():
    return {
        "Authorization": settings.SANDBOX_API_KEY,
        "Content-Type": "application/json",
        "x-accept-cache": "true",
    }


def search_gstin(gstin: str) -> dict:
    url = f"{settings.SANDBOX_BASE_URL}/gst/compliance/public/gstin/search"
    resp = requests.get(f"{url}/{gstin}", headers=_headers(), timeout=15)
    resp.raise_for_status()
    return resp.json()


def track_return(gstin: str, financial_year: str) -> dict:
    url = f"{settings.SANDBOX_BASE_URL}/gst/compliance/public/return/track"
    resp = requests.get(
        url, headers=_headers(), params={"gstin": gstin, "fy": financial_year}, timeout=15
    )
    resp.raise_for_status()
    return resp.json()
