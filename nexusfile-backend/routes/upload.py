from fastapi import APIRouter, UploadFile, File, Form
from typing import List
from agents.orchestrator import orchestrator

router = APIRouter()


@router.post("/upload")
async def upload_invoices(files: List[UploadFile] = File(...), case_id: str = Form(None)):
    """
    Accepts one or more invoice files, runs them through the
    Ingestion + Classification agents, and returns the case_id plus
    structured invoice data.
    """
    if not case_id or case_id.strip().lower() in ("", "string"):
        case_id = orchestrator.start_case()

    file_tuples = []
    for f in files:
        content = await f.read()
        file_tuples.append((content, f.filename, f.content_type))

    invoices = orchestrator.ingest_and_classify(case_id, file_tuples)
    
    from routes.case import SESSION_INVOICES
    if case_id not in SESSION_INVOICES:
        SESSION_INVOICES[case_id] = []
    SESSION_INVOICES[case_id].extend([inv.model_dump() for inv in invoices])

    return {
        "case_id": case_id,
        "invoices": [inv.model_dump() for inv in invoices],
    }

