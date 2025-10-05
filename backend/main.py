from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from pathlib import Path
import json
import os
import shutil

app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000/"],  # React frontend
    allow_credentials=True,
    allow_methods=[""],
    allow_headers=[""],
)

@app.post("/upload")
async def upload_file(bank: str = Form(...), file: UploadFile = File(...)):
    # Normalize bank name to full folder name
    if bank.lower() == "banka" or bank.lower() == "a":
        bank_folder = "BankA"
    elif bank.lower() == "bankb" or bank.lower() == "b":
        bank_folder = "BankB"
    else:
        return {"error": f"Invalid bank name: {bank}"}

    # Construct the absolute folder path (inside backend/BankA/uploads or backend/BankB/uploads)
    base_dir = os.path.dirname(os.path.abspath(file))
    upload_dir = os.path.join(base_dir, bank_folder, "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, file.filename)

    # Save the file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print(f"✅ File saved to: {file_path}")
    return {"message": f"File uploaded successfully to {upload_dir}", "filename": file.filename}

# ✅ Correct import for your schema parser
from .schema_parser import parse_schema_workbook, save_schema_json

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
from .ai_mapping import auto_map

# File paths
BANK1_FILE = "backend/schemas/bank1__bank1_schema.json"
BANK2_FILE = "backend/schemas/bank2__bank2_schema.json"

@app.get("/auto-map")
def run_auto_mapping():
    result = auto_map(BANK1_FILE, BANK2_FILE, "backend/schemas")
    return result
