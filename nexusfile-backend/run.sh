#!/bin/bash
# Convenience script: activate venv and start the dev server.
# Run with: bash run.sh

source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
