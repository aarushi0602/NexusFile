"""
Wraps BigQuery reads/writes for the invoice ledger and reconciliation
results. Run the table-creation SQL once (see /tests or the README
snippet) before calling these.
"""
from google.cloud import bigquery
from config import settings

_client = None


def get_client():
    global _client
    if _client is None:
        _client = bigquery.Client(project=settings.GCP_PROJECT_ID)
    return _client


def table_ref(table_name: str) -> str:
    return f"{settings.GCP_PROJECT_ID}.{settings.BIGQUERY_DATASET}.{table_name}"


def insert_rows(table_name: str, rows: list[dict]):
    client = get_client()
    table = table_ref(table_name)
    try:
        errors = client.insert_rows_json(table, rows, timeout=3)
        if errors:
            print(f"[WARN] BigQuery insert errors: {errors}")
    except Exception as e:
        print(f"[WARN] BigQuery insert_rows_json exception: {e}")
    return {"inserted": len(rows)}



def query(sql: str) -> list[dict]:
    client = get_client()
    job = client.query(sql)
    return [dict(row) for row in job.result()]


def ensure_dataset_and_tables():
    """
    Run once at setup time. Creates the dataset + two core tables
    (invoices, reconciliation_results) if they don't already exist.
    """
    client = get_client()
    dataset_id = f"{settings.GCP_PROJECT_ID}.{settings.BIGQUERY_DATASET}"

    dataset = bigquery.Dataset(dataset_id)
    dataset.location = settings.GCP_LOCATION
    client.create_dataset(dataset, exists_ok=True)

    invoices_schema = [
        bigquery.SchemaField("invoice_id", "STRING"),
        bigquery.SchemaField("vendor_name", "STRING"),
        bigquery.SchemaField("vendor_gstin", "STRING"),
        bigquery.SchemaField("invoice_number", "STRING"),
        bigquery.SchemaField("invoice_date", "STRING"),
        bigquery.SchemaField("subtotal", "FLOAT"),
        bigquery.SchemaField("tax_amount", "FLOAT"),
        bigquery.SchemaField("total_amount", "FLOAT"),
        bigquery.SchemaField("category", "STRING"),
        bigquery.SchemaField("is_b2b", "BOOLEAN"),
        bigquery.SchemaField("source_file", "STRING"),
        bigquery.SchemaField("case_id", "STRING"),
    ]
    invoices_table = bigquery.Table(table_ref("invoices"), schema=invoices_schema)
    client.create_table(invoices_table, exists_ok=True)

    recon_schema = [
        bigquery.SchemaField("invoice_id", "STRING"),
        bigquery.SchemaField("status", "STRING"),
        bigquery.SchemaField("expected_amount", "FLOAT"),
        bigquery.SchemaField("actual_amount", "FLOAT"),
        bigquery.SchemaField("difference", "FLOAT"),
        bigquery.SchemaField("notes", "STRING"),
        bigquery.SchemaField("case_id", "STRING"),
    ]
    recon_table = bigquery.Table(table_ref("reconciliation_results"), schema=recon_schema)
    client.create_table(recon_table, exists_ok=True)

    return {"status": "ready"}
