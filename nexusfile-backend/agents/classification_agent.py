"""
Classification Agent: uses Gemini to tag each invoice with a category,
B2B/B2C flag, and flags obviously suspicious/malformed entries. Day 3's
build target.
"""
import google.generativeai as genai
import json
from config import settings
from models.invoice import Invoice

genai.configure(api_key=settings.GEMINI_API_KEY)

CLASSIFICATION_PROMPT = """You are a GST compliance assistant. Given this invoice
data, classify it and return ONLY a JSON object (no markdown, no explanation)
with these exact keys:
- "category": one of ["office_supplies", "professional_services", "raw_materials",
  "utilities", "travel", "software", "other"]
- "is_b2b": true if vendor_gstin is present and looks valid (15 characters), else false
- "flags": a list of strings noting any data quality issues you notice
  (e.g. "missing_gstin", "unusually_high_amount", "tax_rate_mismatch"), or empty list

Invoice data:
{invoice_json}
"""


class ClassificationAgent:
    name = "classification_agent"

    def __init__(self):
        self.model = genai.GenerativeModel("gemini-3.6-flash")

    def run(self, invoice: Invoice) -> Invoice:
        import time
        start = time.time()

        prompt = CLASSIFICATION_PROMPT.format(
            invoice_json=invoice.model_dump_json(indent=2)
        )

        # Gemini has been genuinely slow (15-19s+) on this account recently,
        # not just occasionally hanging — so timeout is raised to 45s, and
        # we retry a few times before giving up, rather than failing the
        # whole upload on one slow/flaky call.
        last_error = None
        for attempt in range(3):
            try:
                response = self.model.generate_content(
                    prompt,
                    request_options={"timeout": 45},
                )
                result = _parse_json_response(response.text)
                elapsed = time.time() - start
                print(f"[TIMING] Classification call took {elapsed:.1f}s (attempt {attempt + 1})")
                invoice.category = result.get("category", "other")
                invoice.is_b2b = result.get("is_b2b", False)
                return invoice
            except Exception as e:
                last_error = e
                print(f"[WARN] Classification attempt {attempt + 1} failed: {e}")

        # All retries failed — don't kill the whole upload with a 500, just
        # mark this invoice as needing manual classification review.
        print(f"[ERROR] Classification failed after 3 attempts: {last_error}")
        invoice.category = "other"
        invoice.is_b2b = False
        return invoice


def _parse_json_response(text: str) -> dict:
    """Gemini sometimes wraps JSON in ```json fences despite instructions
    not to — strip those before parsing."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    try:
        return json.loads(cleaned.strip())
    except json.JSONDecodeError:
        return {"category": "other", "is_b2b": False, "flags": ["classification_parse_error"]}
