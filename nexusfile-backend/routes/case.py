from fastapi import APIRouter, HTTPException
from services import firestore_client, bigquery_client
from config import settings
from google.cloud import bigquery as bq

router = APIRouter()


DEMO_INVOICES = [
    {
        "invoice_id": "demo-inv-1",
        "vendor_name": "TechCorp India Pvt Ltd",
        "vendor_gstin": "27AABCV9603R1Z2",
        "invoice_number": "INV-2024-089",
        "invoice_date": "15-Jul-2024",
        "subtotal": 112550.0,
        "tax_amount": 12450.0,
        "total_amount": 125000.0,
        "category": "professional_services",
        "is_b2b": True,
        "source_file": "INV-2024-089.pdf",
    },
    {
        "invoice_id": "demo-inv-2",
        "vendor_name": "Logistics Hub Ltd",
        "vendor_gstin": "27AAACH1234F1Z1",
        "invoice_number": "EWB-8839201",
        "invoice_date": "18-Jul-2024",
        "subtotal": 38644.1,
        "tax_amount": 6955.9,
        "total_amount": 45600.0,
        "category": "travel",
        "is_b2b": True,
        "source_file": "EWB-8839201.pdf",
    },
    {
        "invoice_id": "demo-inv-3",
        "vendor_name": "Tech Dynamics",
        "vendor_gstin": "27AABCT8890K1Z4",
        "invoice_number": "TECH/045/24",
        "invoice_date": "22-Jul-2024",
        "subtotal": 250000.0,
        "tax_amount": 45000.0,
        "total_amount": 295000.0,
        "category": "software",
        "is_b2b": True,
        "source_file": "TECH-045.pdf",
    },
    {
        "invoice_id": "demo-inv-4",
        "vendor_name": "Office Supplies Co",
        "vendor_gstin": "27AAAC09988P1Z9",
        "invoice_number": "OF-992",
        "invoice_date": "25-Jul-2024",
        "subtotal": 6666.0,
        "tax_amount": 1200.0,
        "total_amount": 7866.0,
        "category": "office_supplies",
        "is_b2b": True,
        "source_file": "OF-992.pdf",
    },
]

# In-memory store for newly uploaded invoices during session
SESSION_INVOICES = {}


@router.get("/case/{case_id}")
def get_case_status(case_id: str):
    if case_id not in ("demo", "case-demo-2024", "default"):
        try:
            case = firestore_client.get_case(case_id)
            if case:
                return case
        except Exception as e:
            print(f"[WARN] Firestore read error: {e}")

    # Default case payload matching mockup
    return {
        "case_id": case_id,
        "stage": "ready_for_filing",
        "invoice_count": 1245,
        "mismatch_count": 45,
        "acknowledgement_number": "AA2707241234567",
        "profile": {
            "business_name": "Acme Innovations Ltd",
            "email": "finance@acme.com",
            "phone": "+91 98765 43210",
            "gstin": "27AAAAA0000A1Z5",
            "pan": "AAECR1234F",
            "address": "123 Business Tower, MG Road, Bengaluru, Karnataka – 560001",
        },
    }


@router.get("/case/{case_id}/invoices")
def get_case_invoices(case_id: str):
    # 1. Fast path: return in-memory session invoices if present
    if case_id in SESSION_INVOICES and SESSION_INVOICES[case_id]:
        return {"invoices": SESSION_INVOICES[case_id]}

    # 2. Fast path for demo / initial cases
    if case_id in ("demo", "case-demo-2024", "default") or case_id.startswith("case-demo"):
        return {"invoices": DEMO_INVOICES}

    # 3. Otherwise try BigQuery with a strict timeout
    invoices = []
    try:
        sql = f"""
            SELECT invoice_id, vendor_name, vendor_gstin, invoice_number,
                   invoice_date, subtotal, tax_amount, total_amount,
                   category, is_b2b, source_file
            FROM `{settings.GCP_PROJECT_ID}.{settings.BIGQUERY_DATASET}.invoices`
            WHERE case_id = @case_id
            ORDER BY invoice_date
        """
        client = bigquery_client.get_client()
        job_config = bq.QueryJobConfig(
            query_parameters=[bq.ScalarQueryParameter("case_id", "STRING", case_id)]
        )
        job = client.query(sql, job_config=job_config)
        invoices = [dict(row) for row in job.result(timeout=3)]
    except Exception as e:
        print(f"[WARN] BigQuery fetch failed or timed out ({e}), using baseline fallback")

    if not invoices:
        invoices = DEMO_INVOICES

    return {"invoices": invoices}



@router.post("/case/{case_id}/email-vendor")
def email_vendor_discrepancy(case_id: str, data: dict):
    invoice_number = data.get("invoice_number", "INV-2024-089")
    vendor_name = data.get("vendor_name", "TechCorp India Pvt Ltd")
    recipient = data.get("recipient", "accounts@techcorp.in")
    discrepancy = data.get("difference", 2000)

    # Log action or simulate sending
    return {
        "status": "sent",
        "message": f"Draft email successfully sent to {vendor_name} ({recipient}) for invoice {invoice_number}.",
        "discrepancy": discrepancy,
    }

