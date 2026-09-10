"""
Wraps Firestore for case state (the thing your frontend polls to
show the status timeline) and the approval/audit trail.
"""
from google.cloud import firestore
from config import settings
from datetime import datetime

_client = None


def get_client():
    global _client
    if _client is None:
        _client = firestore.Client(project=settings.GCP_PROJECT_ID)
    return _client


def create_case(case_id: str, initial_data: dict):
    client = get_client()
    doc_ref = client.collection("cases").document(case_id)
    doc_ref.set(initial_data)
    return case_id


def update_case_stage(case_id: str, stage: str, extra_fields: dict = None):
    client = get_client()
    doc_ref = client.collection("cases").document(case_id)
    update_data = {"stage": stage, "updated_at": datetime.utcnow().isoformat()}
    if extra_fields:
        update_data.update(extra_fields)
    # set(merge=True) instead of update(): update() throws NotFound if the
    # document doesn't exist yet (e.g. a client passed a case_id that was
    # never created via create_case), which turned into a confusing 500.
    # merge=True creates it if missing and merges fields if it exists.
    doc_ref.set(update_data, merge=True)
    return update_data


def get_case(case_id: str) -> dict:
    client = get_client()
    doc = client.collection("cases").document(case_id).get()
    if not doc.exists:
        return None
    return doc.to_dict()


def find_case_by_email(email: str) -> dict:
    """
    Looks up a case whose profile.email matches. This is what powers the
    'Log in' flow — since there's no separate user-account system, a
    business's email is the lookup key back to their existing case.

    Deliberately a plain equality filter with no order_by: combining an
    equality filter with order_by on a different field requires a
    Firestore composite index to be created first, which would break
    this on first use in a fresh project.
    """
    client = get_client()
    query = client.collection("cases").where("profile.email", "==", email).limit(5)
    docs = list(query.stream())
    if not docs:
        return None
    # If multiple cases share an email, return the most recently updated one.
    docs.sort(key=lambda d: d.to_dict().get("updated_at", ""), reverse=True)
    data = docs[0].to_dict()
    data["case_id"] = docs[0].id
    return data


def log_audit_event(case_id: str, event: str, details: dict = None):
    """Appends an entry to the case's audit subcollection — useful
    for showing 'what did the agent actually do and when' in the UI."""
    client = get_client()
    events_ref = client.collection("cases").document(case_id).collection("events")
    events_ref.add({
        "event": event,
        "details": details or {},
        "timestamp": datetime.utcnow().isoformat(),
    })
