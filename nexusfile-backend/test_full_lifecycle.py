"""
Runs the entire NexusFile lifecycle against your LIVE running backend
(http://localhost:8000) in one go: upload -> reconcile -> draft ->
approve/file -> check case status. Prints a clear pass/fail summary at
each stage so you can see exactly where anything breaks, without
manually clicking through Swagger every time.

Prerequisites:
  - uvicorn main:app --reload   (running in another terminal)
  - synthetic-data/sample_pdfs/*.pdf available locally

Usage:
  python test_full_lifecycle.py
"""
import requests
import time
import sys
import os

BASE_URL = "http://localhost:8000"

# Adjust this path to wherever you unzipped the synthetic dataset
SAMPLE_PDF_DIR = "../synthetic-data/sample_pdfs"

DEMO_GSTIN = "27AAAPL1234C1Z9"
DEMO_PERIOD = "082026"


def step(label):
    print(f"\n{'=' * 60}\n{label}\n{'=' * 60}")


def check(condition, success_msg, fail_msg):
    if condition:
        print(f"  [OK] {success_msg}")
        return True
    else:
        print(f"  [FAIL] {fail_msg}")
        return False


def main():
    all_passed = True

    step("Step 0: Health check")
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=10)
        data = resp.json()
        all_passed &= check(
            resp.status_code == 200 and data.get("status") == "ok",
            f"Backend healthy: {data}",
            f"Backend unhealthy or misconfigured: {data}",
        )
        if data.get("status") != "ok":
            print("  Fix missing_config before continuing - aborting test.")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("  [FAIL] Could not connect to backend. Is 'uvicorn main:app --reload' running?")
        sys.exit(1)

    step("Step 1: Upload sample invoices")
    if not os.path.isdir(SAMPLE_PDF_DIR):
        print(f"  [FAIL] Sample PDF folder not found at {SAMPLE_PDF_DIR}")
        print("  Adjust SAMPLE_PDF_DIR at the top of this script.")
        sys.exit(1)

    pdf_files = sorted(
        f for f in os.listdir(SAMPLE_PDF_DIR) if f.lower().endswith(".pdf")
    )[:5]
    print(f"  Uploading {len(pdf_files)} sample invoices...")

    case_id = None
    all_invoices = []
    for fname in pdf_files:
        path = os.path.join(SAMPLE_PDF_DIR, fname)
        with open(path, "rb") as f:
            files = {"files": (fname, f, "application/pdf")}
            data = {"case_id": case_id} if case_id else {}
            t0 = time.time()
            resp = requests.post(f"{BASE_URL}/upload", files=files, data=data, timeout=90)
            elapsed = time.time() - t0

        if resp.status_code != 200:
            print(f"  [FAIL] Upload failed for {fname}: {resp.status_code} {resp.text}")
            all_passed = False
            continue

        result = resp.json()
        case_id = result["case_id"]
        all_invoices.extend(result["invoices"])
        print(f"  [OK] {fname} ingested in {elapsed:.1f}s "
              f"(vendor={result['invoices'][0]['vendor_name']}, "
              f"gstin={result['invoices'][0]['vendor_gstin']})")

    all_passed &= check(
        len(all_invoices) > 0, f"{len(all_invoices)} invoices ingested",
        "No invoices were successfully ingested - aborting."
    )
    if not all_invoices:
        sys.exit(1)

    print(f"\n  Case ID: {case_id}")

    step("Step 2: Run reconciliation")
    resp = requests.post(f"{BASE_URL}/reconcile", json={
        "case_id": case_id,
        "gstin": DEMO_GSTIN,
        "period": DEMO_PERIOD,
        "invoices": all_invoices,
    }, timeout=30)

    all_passed &= check(
        resp.status_code == 200,
        "Reconciliation completed",
        f"Reconciliation failed: {resp.status_code} {resp.text}",
    )
    reconciliation = resp.json().get("reconciliation", []) if resp.status_code == 200 else []

    matched = sum(1 for r in reconciliation if r["status"] == "matched")
    mismatched = sum(1 for r in reconciliation if r["status"] == "mismatched")
    missing = sum(1 for r in reconciliation if r["status"] == "missing_in_gstr2b")
    print(f"  Results: {matched} matched, {mismatched} mismatched, {missing} missing in GSTR-2B")

    step("Step 3: Generate return draft")
    resp = requests.post(f"{BASE_URL}/draft", json={
        "case_id": case_id,
        "gstin": DEMO_GSTIN,
        "period": DEMO_PERIOD,
        "invoices": all_invoices,
        "reconciliation": reconciliation,
    }, timeout=30)

    all_passed &= check(
        resp.status_code == 200,
        "Draft generated",
        f"Draft generation failed: {resp.status_code} {resp.text}",
    )
    draft = resp.json().get("draft") if resp.status_code == 200 else None
    if draft:
        print(f"  Net tax liability: {draft['summary']['net_tax_liability']}")
        print(f"  Flagged for review: {len(draft['flagged_for_review'])} invoice(s)")

    step("Step 4: Approve and file")
    if draft:
        resp = requests.post(f"{BASE_URL}/approve", json={
            "case_id": case_id,
            "gstin": DEMO_GSTIN,
            "period": DEMO_PERIOD,
            "return_type": "GSTR3B",
            "draft": draft,
            "approved": True,
        }, timeout=30)

        all_passed &= check(
            resp.status_code == 200,
            f"Filed successfully - acknowledgement: {resp.json().get('acknowledgement_number') if resp.status_code == 200 else None}",
            f"Filing failed: {resp.status_code} {resp.text}",
        )

    step("Step 5: Confirm final case status")
    resp = requests.get(f"{BASE_URL}/case/{case_id}", timeout=10)
    case_data = resp.json() if resp.status_code == 200 else {}
    all_passed &= check(
        case_data.get("stage") == "filed",
        f"Case reached 'filed' stage: {case_data}",
        f"Case did not reach 'filed' stage: {case_data}",
    )

    step("SUMMARY")
    if all_passed:
        print("  ALL STAGES PASSED - full lifecycle works end to end.")
    else:
        print("  SOME STAGES FAILED - see [FAIL] marks above for details.")
    print(f"\n  Case ID for manual inspection: {case_id}")
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
