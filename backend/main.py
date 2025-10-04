from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from pathlib import Path
import json

# ✅ Correct import for your schema parser
from .schema_parser import parse_schema_workbook, save_schema_json

app = FastAPI(title="EY Schema Merger API")

# ✅ Allow frontend (Next.js) to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Directory to store parsed JSON files
SCHEMA_DIR = Path(__file__).parent / "schemas"


@app.get("/health")
def health():
    """Simple health check endpoint."""
    return {"ok": True}


@app.post("/schemas/parse")
async def parse_schemas(files: List[UploadFile] = File(...)) -> Dict[str, 
Any]:
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

            # Save parsed JSON to backend/schemas/
            out_path = save_schema_json(parsed, SCHEMA_DIR)

            # Add result to summary
            results.append({
                "file": f.filename,
                "saved_to": out_path.name,
                "bank": parsed["bank"],
            })
        except Exception as e:
            # ⚠️ Properly formatted exception message
            raise HTTPException(status_code=400, detail=f"{f.filename}:{e}")

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

