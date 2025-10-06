from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
import os
import shutil
from typing import List, Dict, Any
from pathlib import Path
import json
import io
import sys
from contextlib import redirect_stdout
from schema_parser import run_schema_parser, parse_schema_workbook, save_schema_json
from merge_banks import run_merge_banks
from ai_mapping import run_ai_mapping, auto_map
from transform_unified import run_transform_unified

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pipeline Orchestrator Endpoint ---
@app.post("/run-pipeline")
async def run_pipeline():
    """
    Run the full backend pipeline in order and return all logs.
    """
    log_stream = io.StringIO()
    try:
        BANK1_FILE = "schemas/bank1__bank1_schema.json"
        BANK2_FILE = "schemas/bank2__bank2_schema.json"
        schemas_dir = Path("schemas")
        # Check for required schema files before running pipeline
        bank1_exists = Path(BANK1_FILE).exists()
        bank2_exists = Path(BANK2_FILE).exists()
        if not (bank1_exists and bank2_exists):
            existing_files = list(schemas_dir.glob("*.json"))
            existing_files_str = ", ".join([f.name for f in existing_files])
            error_msg = (
                f"Required schema files not found.\n"
                f"Checked for: {BANK1_FILE} (exists: {bank1_exists}), {BANK2_FILE} (exists: {bank2_exists})\n"
                f"Files currently in {schemas_dir}: {existing_files_str if existing_files else '[none]'}\n"
                f"Please ensure both files are uploaded and parsed with the correct names."
            )
            return {
                "success": False,
                "error": error_msg,
                "logs": ""
            }
        with redirect_stdout(log_stream):
            # 1. Parse schemas (simulate with empty input for now)
            # TODO: Replace with actual uploaded files if needed
            # run_schema_parser([(file_bytes, filename), ...], output_dir)
            print("[pipeline] Skipping schema parsing step (requires uploaded files)")

            # 2. Merge banks
            run_merge_banks()

            # 3. AI mapping
            run_ai_mapping(BANK1_FILE, BANK2_FILE, "schemas")

            # 4. Transform unified
            run_transform_unified()

        logs = log_stream.getvalue()
        return {"success": True, "logs": logs}
    except Exception as e:
        logs = log_stream.getvalue()
        return {"success": False, "error": str(e), "logs": logs}

# ✅ Directory to store parsed JSON files
SCHEMA_DIR = Path(__file__).parent / "schemas"

@app.post("/schemas/parse")
async def parse_schemas(files: List[UploadFile] = File(...)) -> Dict[str, Any]:
    """
    Accept schema Excel files, parse them into JSON, save to disk,
    and return a summary of what was parsed.
    """
    results = []
    for f in files:
        try:
            # Read Excel file
            content = await f.read()

            # Parse schema workbook → structured JSON
            parsed = parse_schema_workbook(content, f.filename)

            # ✅ Include source filename (needed for naming when saving)
            parsed["source_file"] = f.filename

            # Save parsed JSON to backend/schemas/
            out_path = save_schema_json(parsed, SCHEMA_DIR)

            # Add result to summary
            results.append({
                "file": f.filename,
                "saved_to": out_path.name,
                "bank": parsed.get("bank", "Unknown"),
            })
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"{f.filename}: {e}")

    return {"parsed": results}


@app.get("/schemas/list")
def list_schema_json():
    """List all parsed schema JSON files."""
    files = sorted(SCHEMA_DIR.glob("*.json"))
    return {"files": [p.name for p in files]}


@app.get("/schemas/{name}")
def read_schema_json(name: str):
    """Return the contents of a specific parsed schema JSON file."""
    path = SCHEMA_DIR / name
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"{name} not found")
    return json.loads(path.read_text(encoding="utf-8"))

# app.py
from ai_mapping import auto_map

# File paths
BANK1_FILE = "backend/schemas/bank1__bank1_schema.json"
BANK2_FILE = "backend/schemas/bank2__bank2_schema.json"

@app.get("/auto-map")
def run_auto_mapping():
    result = auto_map(BANK1_FILE, BANK2_FILE, "backend/schemas")
    return result

@app.post("/upload")
async def upload_file(bank: str = Form(...), file: UploadFile = File(...)):
    bank_map = {"a": "BankA", "b": "BankB", "banka": "BankA", "bankb": "BankB"}
    bank_folder = bank_map.get(bank.lower())
    if not bank_folder:
        return {"error": f"Invalid bank name: {bank}"}

    # Always resolve relative to the backend folder, even if run from backend/
    backend_dir = Path(__file__).parent.resolve()
    upload_dir = backend_dir / bank_folder / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / file.filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print(f"✅ File saved to: {file_path}")
    return {"message": f"File uploaded successfully to {upload_dir}", "filename": file.filename}

from fastapi import WebSocket
import asyncio

@app.websocket("/ws/pipeline-logs")
async def pipeline_logs(websocket: WebSocket):
    await websocket.accept()
    try:
        # Example: send logs as each step runs
        for step in ["Merging banks...", "AI mapping...", "Transforming unified..."]:
            await websocket.send_text(f"[pipeline] {step}")
            await asyncio.sleep(1)  # Simulate work
        await websocket.send_text("[pipeline] Done.")
    except Exception as e:
        await websocket.send_text(f"[error] {str(e)}")
    finally:
        await websocket.close()