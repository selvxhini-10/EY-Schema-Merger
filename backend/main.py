from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
import os
import shutil
from typing import List, Dict, Any
from pathlib import Path
import json

app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Correct import for your schema parser
from schema_parser import parse_schema_workbook, save_schema_json


# ✅ Directory to store parsed JSON files
SCHEMA_DIR = Path(__file__).parent / "schemas"
SCHEMA_DIR.mkdir(parents=True, exist_ok=True)

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


@app.post("/schemas/parse")
async def parse_schemas(
    files: List[UploadFile] = File(...),
    banks: List[str] = Form(...)
) -> Dict[str, Any]:
    """
    Accept schema Excel files, parse them into JSON, save to disk with predictable names,
    and return a summary of what was parsed.
    """
    print(f"[schemas/parse] Received {len(files)} file(s) for parsing.")
    results = []
    if len(files) != len(banks):
        print("[schemas/parse] ERROR: Number of files and banks must match.")
        raise HTTPException(status_code=400, detail="Number of files and banks must match.")
    for f, bank in zip(files, banks):
        try:
            content = await f.read()
            parsed = parse_schema_workbook(content, f.filename)
            parsed["source_file"] = f.filename
            # Save as bank1__bank1_schema.json or bank2__bank2_schema.json
            bank_key = bank.strip().lower()
            if bank_key in ["a", "b", "banka", "bankb", "bank1", "bank2"]:
                if bank_key in ["a", "banka", "bank1"]:
                    out_name = "bank1__bank1_schema.json"
                else:
                    out_name = "bank2__bank2_schema.json"
            else:
                out_name = f"{bank_key}_schema.json"
            out_path = SCHEMA_DIR / out_name
            with open(out_path, "w", encoding="utf-8") as out_f:
                json.dump(parsed, out_f, indent=2, ensure_ascii=False)
            print(f"[schemas/parse] Saved {f.filename} as {out_path}")
            results.append({
                "file": f.filename,
                "saved_to": out_name,
                "bank": bank,
            })
        except Exception as e:
            print(f"[schemas/parse] ERROR saving {f.filename}: {e}")
            raise HTTPException(status_code=400, detail=f"{f.filename}: {e}")
    print(f"[schemas/parse] All files processed. Results: {results}")
    return {"parsed": results}
