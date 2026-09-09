"""
Run this once, after your .env is filled in, to create the BigQuery
dataset and tables:

    python setup_bigquery.py
"""
from services.bigquery_client import ensure_dataset_and_tables

if __name__ == "__main__":
    result = ensure_dataset_and_tables()
    print(f"BigQuery setup complete: {result}")
