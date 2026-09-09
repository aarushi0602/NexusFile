"""
Thin wrapper around Cloud Storage so the rest of the app never
touches the google-cloud-storage SDK directly.
"""
from google.cloud import storage
from config import settings


def get_bucket():
    client = storage.Client(project=settings.GCP_PROJECT_ID)
    return client.bucket(settings.GCS_BUCKET_NAME)


def upload_file(local_path: str, destination_blob_name: str) -> str:
    """Uploads a local file and returns its GCS URI (gs://bucket/path)."""
    bucket = get_bucket()
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(local_path)
    return f"gs://{settings.GCS_BUCKET_NAME}/{destination_blob_name}"


def upload_bytes(data: bytes, destination_blob_name: str, content_type: str) -> str:
    bucket = get_bucket()
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_string(data, content_type=content_type)
    return f"gs://{settings.GCS_BUCKET_NAME}/{destination_blob_name}"


def download_bytes(blob_name: str) -> bytes:
    bucket = get_bucket()
    blob = bucket.blob(blob_name)
    return blob.download_as_bytes()
