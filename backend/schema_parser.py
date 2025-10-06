import io
import json
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd

# --- Helper functions ---

def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", str(s or "")).strip()

def _snake(s: str) -> str:
    s = re.sub(r"[^A-Za-z0-9]+", "_", str(s)).strip("_")
    return s.lower()

def _sentence_case(s: str) -> str:
    s = _norm(s)
    if not s:
        return ""
    if s[0].isupper() and s.endswith((".", "!", "?")):
        return s
    text = s[0].upper() + s[1:]
    if len(text) > 12 and not text.endswith((".", "!", "?")):
        text += "."
    return text

def _enhance_description(desc: str, label: str) -> str:
    """Make the description sound professional and informative."""
    d = _norm(desc)
    l = _norm(label)

    # If the cell already has a proper description, clean and return it
    if d and len(d) >= 8:
        return _sentence_case(d)

    # Otherwise, generate a helpful one from the label
    lw = l.lower()
    hint = ""
    if any(k in lw for k in ["id", "identifier", "key", "code"]):
        hint = "identifier"
    elif any(k in lw for k in ["date", "time"]):
        hint = "date"
    elif any(k in lw for k in ["amount", "balance", "rate", "value", "price"]):
        hint = "amount"

    base = f"{l}" if l else "Field"
    if hint:
        return _sentence_case(f"{base} — {hint}.")
    return _sentence_case(f"{base} information.")

# --- Core parsing ---

def parse_schema_workbook(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Parse a schema Excel workbook into a simple label-description JSON."""
    sheets = pd.read_excel(io.BytesIO(file_bytes), sheet_name=None, header=None)

    # Try to guess bank name from filename
    bank_guess = _norm(Path(filename).stem).split("_")[0]

    out: Dict[str, Any] = {"bank": bank_guess or "UnknownBank", "tables": {}}

    for sheet_name, df_raw in sheets.items():
        # Drop empty rows
        df_raw = df_raw.dropna(how="all")
        if df_raw.empty:
            continue

        # Find the header row that contains "name" or "description"
        header_row = None
        for i, row in df_raw.iterrows():
            vals = [str(v).lower() for v in row.values if str(v).strip()]
            if any("name" in v or "desc" in v for v in vals):
                header_row = i
                break

        if header_row is None:
            continue

        # Re-read with the detected header row
        df = pd.read_excel(io.BytesIO(file_bytes), sheet_name=sheet_name, header=header_row)
        df = df.dropna(how="all")
        df.columns = [str(c).strip().lower() for c in df.columns]

        # Identify name and description columns
        name_col = None
        desc_col = None
        for c in df.columns:
            if any(k in c for k in ["name", "field", "column"]) and not name_col:
                name_col = c
            elif any(k in c for k in ["desc", "notes", "details"]) and not desc_col:
                desc_col = c

        if not name_col:
            continue

        rows: List[Dict[str, Any]] = []
        for _, r in df.iterrows():
            label = _norm(r.get(name_col, ""))
            desc = _norm(r.get(desc_col, "")) if desc_col else ""
            if not label or label.lower() in {"name", "field"}:
                continue

            rows.append({
                "label": label,
                "description": _enhance_description(desc, label)
            })

        if rows:
            out["tables"][sheet_name] = rows

    return out


# --- Pipeline runner for orchestrator ---
def run_schema_parser(input_files, output_dir):
    """
    input_files: list of (file_bytes, filename)
    output_dir: Path to save JSONs
    Returns: list of output file paths
    """
    print("[schema_parser] Starting schema parsing...")
    results = []
    for file_bytes, filename in input_files:
        try:
            print(f"[schema_parser] Parsing {filename}...")
            parsed = parse_schema_workbook(file_bytes, filename)
            parsed["source_file"] = filename
            out_path = save_schema_json(parsed, output_dir)
            print(f"[schema_parser] Saved parsed schema to {out_path}")
            results.append(str(out_path))
        except Exception as e:
            print(f"[schema_parser] Error parsing {filename}: {e}")
    print("[schema_parser] Done.")
    return results


def save_schema_json(payload: Dict[str, Any], out_dir: Path) -> Path:
    """Save parsed schema JSON to disk."""
    out_dir.mkdir(parents=True, exist_ok=True)
    bank = _snake(payload.get("bank", "bank"))
    stem = _snake(Path(payload.get("source_file", "schema")).stem)
    out_path = out_dir / f"{bank}__{stem}.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    return out_path
