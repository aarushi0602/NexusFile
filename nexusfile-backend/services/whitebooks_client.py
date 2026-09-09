"""
Wraps calls to the WhiteBooks GSP sandbox API.

WhiteBooks does NOT give you a single API key. Their dashboard (API Keys
page) gives you three things: a base URL, a client_id, and a client_secret.
You exchange client_id + client_secret for a short-lived OAuth2 bearer
token, then use that token on every subsequent call. This module handles
that token exchange and caches the token in memory until it's close to
expiry, so callers never have to think about it.

Endpoint paths below follow WhiteBooks' typical REST conventions —
confirm exact paths against your dashboard's API docs before Day 5.
"""
import requests
import time
from config import settings

_token_cache = {"access_token": None, "expires_at": 0}


def _get_access_token() -> str:
    """Returns a cached token if still valid, otherwise fetches a new one."""
    now = time.time()
    if _token_cache["access_token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["access_token"]

    url = f"{settings.WHITEBOOKS_BASE_URL}/gst/oauth/token"
    resp = requests.post(
        url,
        json={
            "client_id": settings.WHITEBOOKS_CLIENT_ID,
            "client_secret": settings.WHITEBOOKS_CLIENT_SECRET,
            "grant_type": "client_credentials",
        },
        headers={"Content-Type": "application/json"},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()

    # WhiteBooks' exact response shape may differ — check your docs and
    # adjust these keys after your first real test call.
    access_token = data.get("access_token") or data.get("data", {}).get("access_token")
    expires_in = data.get("expires_in", 3600)  # seconds; default guess if not returned

    _token_cache["access_token"] = access_token
    _token_cache["expires_at"] = now + expires_in
    return access_token


def _headers():
    return {
        "Authorization": f"Bearer {_get_access_token()}",
        "Content-Type": "application/json",
    }


def verify_gstin(gstin: str) -> dict:
    """Confirms a GSTIN is valid/active."""
    url = f"{settings.WHITEBOOKS_BASE_URL}/api/v1/gstin/verify"
    resp = requests.get(url, headers=_headers(), params={"gstin": gstin}, timeout=15)
    resp.raise_for_status()
    return resp.json()


def fetch_gstr2b(gstin: str, period: str) -> dict:
    """
    period format e.g. '082026' (MMYYYY) per typical GSTN convention.
    Returns the purchase-side data GSTN has on record for this GSTIN,
    used by the Reconciliation Agent to diff against the user's ledger.
    """
    url = f"{settings.WHITEBOOKS_BASE_URL}/api/v1/returns/gstr2b"
    resp = requests.get(
        url, headers=_headers(), params={"gstin": gstin, "period": period}, timeout=30
    )
    resp.raise_for_status()
    return resp.json()


def file_return(gstin: str, period: str, return_type: str, payload: dict) -> dict:
    """
    Files a return (e.g. GSTR-1 or GSTR-3B) via the sandbox.
    Only call this after explicit user approval — never auto-file.
    """
    url = f"{settings.WHITEBOOKS_BASE_URL}/api/v1/returns/{return_type}/file"
    body = {"gstin": gstin, "period": period, "data": payload}
    resp = requests.post(url, headers=_headers(), json=body, timeout=30)
    resp.raise_for_status()
    return resp.json()
