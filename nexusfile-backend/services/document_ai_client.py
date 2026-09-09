"""
Wraps Document AI calls. Requires a processor to already exist in
GCP Console > Document AI > Create Processor (use an "Invoice Parser"
or "Form Parser" processor type) before this will work.
"""
from google.cloud import documentai_v1 as documentai
from config import settings


def get_client():
    opts = {"api_endpoint": f"{settings.DOCAI_LOCATION}-documentai.googleapis.com"}
    return documentai.DocumentProcessorServiceClient(client_options=opts)


def process_document(file_bytes: bytes, mime_type: str = "application/pdf") -> dict:
    """
    Sends a document to Document AI and returns a simplified dict of
    extracted entities (key -> value) rather than the raw proto,
    which is easier for the Classification Agent to consume.
    """
    client = get_client()
    name = client.processor_path(
        settings.GCP_PROJECT_ID, settings.DOCAI_LOCATION, settings.DOCAI_PROCESSOR_ID
    )

    raw_document = documentai.RawDocument(content=file_bytes, mime_type=mime_type)
    request = documentai.ProcessRequest(name=name, raw_document=raw_document)
    result = client.process_document(request=request)
    document = result.document

    extracted = {}
    for entity in document.entities:
        extracted[entity.type_] = entity.mention_text

    return {
        "raw_text": document.text,
        "entities": extracted,
    }
