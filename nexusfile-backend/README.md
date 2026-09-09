# NexusFile Backend

Agentic GST compliance pipeline: Ingestion -> Classification -> Reconciliation
-> Drafting -> Filing -> Monitoring, orchestrated in `agents/orchestrator.py`.

## 1. Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in every value:

```bash
cp .env.example .env
```

You need:
- `GCP_PROJECT_ID` — your project ID (e.g. `nexusfile-hackathon`)
- `GCS_BUCKET_NAME` — the bucket you created for uploads
- `DOCAI_PROCESSOR_ID` — create one in GCP Console > Document AI > Create
  Processor (choose "Invoice Parser"), then copy its ID
- `GEMINI_API_KEY` — from Google AI Studio
- `WHITEBOOKS_API_KEY` / `WHITEBOOKS_BASE_URL` — from your WhiteBooks sandbox account
- `SANDBOX_API_KEY` / `SANDBOX_BASE_URL` — from your Sandbox.co.in account

### Authenticate to GCP locally

```bash
gcloud auth application-default login
gcloud config set project nexusfile-hackathon
```

This lets the Firestore/BigQuery/Storage/Document AI SDKs authenticate
without you handling service account JSON keys manually.

## 2. Create BigQuery tables (one-time)

```bash
python setup_bigquery.py
```

## 3. Run the server

```bash
uvicorn main:app --reload
```

Visit `http://localhost:8000/health` — should return `"status": "ok"`.
If it says `"misconfigured"`, check the `missing_config` list in the response.

Visit `http://localhost:8000/docs` for interactive Swagger UI to test
every endpoint without needing the frontend.

## 4. Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Config sanity check |
| POST | `/upload` | Upload invoice files, runs Ingestion + Classification agents |
| GET | `/case/{case_id}` | Get current case status/stage |
| POST | `/draft` | Generate a return draft from reconciled data |
| POST | `/approve` | Human approval gate — only route that triggers real filing |

## 5. Testing without real WhiteBooks/GSTIN data

`services/whitebooks_client.py` and `services/sandbox_client.py` hit real
sandbox URLs. If you want to test the pipeline logic before your sandbox
credentials are fully working, temporarily mock these functions to return
fixture JSON (see `agents/reconciliation_agent.py` for the expected shape)
rather than blocking Day 2-4 work on external approvals.

## 6. Notes on Document AI entity keys

`agents/ingestion_agent.py` maps Document AI's returned entity names
(e.g. `supplier_name`, `total_amount`) to our `Invoice` model. These key
names depend on which processor type you provisioned. After your first
real test upload, print `extracted["entities"]` to see the actual keys
Document AI returns and adjust the mapping if needed.

## 7. Swapping in real Google ADK

The `Orchestrator` class in `agents/orchestrator.py` is written as plain
Python method calls so it runs today with zero extra setup. Once you've
confirmed ADK's install and agent-registration pattern in your environment,
wrap each agent class as an ADK sub-agent/tool under a root agent, keeping
the same `run_pipeline`-style entrypoints so `routes/*.py` doesn't need to change.
