from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routes import upload, case, approve, reconcile, profile

app = FastAPI(title="NexusFile API", version="0.1.0")

# Allow the Vite dev server (default port 5173) to call this API during
# local development. Tighten this before any real deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, tags=["upload"])
app.include_router(case.router, tags=["case"])
app.include_router(approve.router, tags=["approve"])
app.include_router(reconcile.router, tags=["reconcile"])
app.include_router(profile.router, tags=["profile"])


@app.get("/health")
def health():
    missing = settings.missing_keys()
    return {
        "status": "ok" if not missing else "misconfigured",
        "project": settings.GCP_PROJECT_ID,
        "missing_config": missing,
    }


@app.get("/")
def root():
    return {"message": "NexusFile API is running. See /docs for endpoints."}
