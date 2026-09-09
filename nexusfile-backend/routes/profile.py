from fastapi import APIRouter
from agents.orchestrator import orchestrator
from models.profile import BusinessProfile

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
