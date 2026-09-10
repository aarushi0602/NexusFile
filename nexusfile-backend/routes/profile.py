from fastapi import APIRouter, HTTPException
from agents.orchestrator import orchestrator
from models.profile import BusinessProfile
from services import firestore_client

router = APIRouter()


@router.post("/case/create")
def create_case_with_profile(profile: BusinessProfile):
    """
    Creates a new case with the business's contact details attached
    upfront, so the Notification Agent knows where to send the
    filing confirmation later — without this, there's no email/phone
    on record and the loop never closes.
    """
    case_id = orchestrator.start_case(profile.model_dump())
    return {"case_id": case_id}


@router.get("/case/lookup")
def lookup_case_by_email(email: str):
    """
    Powers the 'Log in' flow. There's no separate user-account system —
    a business's email (given at signup) is the lookup key back to their
    existing case. Returns 404 if no case was ever created with that email.
    """
    case = firestore_client.find_case_by_email(email)
    if case is None:
        raise HTTPException(status_code=404, detail="No case found for that email")
    return case
