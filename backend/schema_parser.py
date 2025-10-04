import io
import json
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd

print("Hi")

# Kno   wn type keywords
TYPE_HINTS = {
    "string", "str", "text", "varchar", "char",
    "int", "integer", "bigint", "smallint",
    "float", "double", "decimal", "number", "numeric",
    "bool", "boolean",
    "date", "datetime", "timestamp", "time"
}

# Recognized header aliases (still useful if sheets have standard names)
SCHEMA_COL_ALIASES = {
    "field name": {"field", "name", "column", "column name"},
    "data type": {"type", "datatype", "format"},
    "description": {"desc", "details", "notes", "description"},
    "sample value": {"sample", "example", "example value"},
    "table": {"table", "sheet", "tab"},
}


def _norm(s: str) -> str:
    """Normalize whitespace and ensure string."""
    return re.sub(r"\s+", " ", str(s or "")).strip()


def _snake(s: str) -> str:
    """Convert a string to snake_case for consistency."""
    s = re.sub(r"[^A-Za-z0-9]+", "_", str(s)).strip("_")
    return s.lower()


def _pick_col(df: pd.DataFrame, want: str) -> Optional[str]:
    """Try to find a column by alias or substring match."""
    want_lower = want.lower()
    candidates = {want_lower} | SCHEMA_COL_ALIASES.get(want_lower, set())
    cols = {c.lower().strip(): c for c in df.columns}
    for c in cols:
        if c in candidates:
            return cols[c]
    for c in cols:
        for w in candidates:
            if w in c:
                return cols[c]
    return None


# --- NEW SMART FALLBACKS BELOW ---

def _looks_like_identifier(s: str) -> bool:
    s = _norm(s)
    return 1 <= len(s) <= 40 and len(s.split()) <= 3 and bool(re.match(r"^[A-Za-z0-9_\-\.]+$", s))


def _looks_like_sentence(s: str) -> bool:
    s = _norm(s)
    return len(s) >= 15 and (" " in s or "." in s)


def _looks_like_type(s: str) -> bool:
    s = _norm(s).lower()
    return s in TYPE_HINTS or any(t in s for t in TYPE_HINTS)


def _infer_schema_columns(df: pd.DataFrame):
    """Infer which columns likely correspond to field/type/description/sample."""
    if df.empty or df.shape[1] == 0:
        return (None, None, None, None)

    cols = list(df.columns)
    scores = {c: {"field": 0, "type": 0, "desc": 0, "sample": 0} for c in cols}

    for c in cols:
        series = df[c].dropna().astype(str).head(200)
        if series.empty:
            continue
        id_like = sum(_looks_like_identifier(v) for v in series)
        sent_like = sum(_looks_like_sentence(v) for v in series)
        type_like = sum(_looks_like_type(v) for v in series)

        scores[c]["field"] += id_like * 2 - sent_like
        scores[c]["desc"] += sent_like * 2 - id_like
        scores[c]["type"] += type_like * 3
        scores[c]["sample"] += max(0, len(series) - (id_like + sent_like + type_like))

        cl = str(c).lower().strip()
        if "name" in cl or "field" in cl or "column" in cl:
            scores[c]["field"] += 3
        if "desc" in cl or "note" in cl or "detail" in cl:
            scores[c]["desc"] += 3
        if "type" in cl or "format" in cl or "datatype" in cl:
            scores[c]["type"] += 3
        if "sample" in cl or "example" in cl:
            scores[c]["sample"] += 3

    def pick(role):
        return max(cols, key=lambda c: scores[c][role]) if cols else None

    field_col = pick("field")
    if field_col and scores[field_col]["field"] <= 0:
        field_col = None

    remaining = [c for c in cols if c != field_col]
    type_col = max(remaining, key=lambda c: scores[c]["type"]) if remaining else None
    if type_col and scores[type_col]["type"] <= 0:
        type_col = None
    remaining = [c for c in remaining if c != type_col]
    desc_col = max(remaining, key=lambda c: scores[c]["desc"]) if remaining else None
    if desc_col and scores[desc_col]["desc"] <= 0:
        desc_col = None
    remaining = [c for c in remaining if c != desc_col]
    sample_col = max(remaining, key=lambda c: scores[c]["sample"]) if remaining else None

    return (field_col, type_col, desc_col, sample_col)


# --- END FALLBACK LOGIC ---


def classify_workbook(sheets: Dict[str, pd.DataFrame]) -> str:
    """Heuristic: detect if file looks like schema or raw data."""
    schema_hits, data_hits = 0, 0
    for _, df in sheets.items():
        cols = {c.lower().strip() for c in df.columns}
        if any("field" in c or "name" in c or "desc" in c for c in cols):
            schema_hits += 1
        if len(df) >= 5:
            data_hits += 1
    return "schema" if schema_hits >= data_hits else "data"


def parse_schema_workbook(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Parse a schema workbook into normalized JSON."""
    sheets = pd.read_excel(io.BytesIO(file_bytes), sheet_name=None)
    kind = classify_workbook(sheets)
    if kind != "schema":
        raise ValueError(f"{filename} does not look like a schema workbook")

    bank_guess = _norm(Path(filename).stem).split("_")[0]

    out: Dict[str, Any] = {
        "bank": bank_guess or "UnknownBank",
        "source_file": filename,
        "tables": {}
    }

    for sheet_name, df in sheets.items():
        # Identify columns (try aliases first)
        col_field = _pick_col(df, "Field Name")
        col_type = _pick_col(df, "Data Type")
        col_desc = _pick_col(df, "Description")
        col_sample = _pick_col(df, "Sample Value")
        col_table = _pick_col(df, "Table")

        # If no obvious field column, infer by content
        if not col_field:
            col_field, col_type_inf, col_desc_inf, col_sample_inf = _infer_schema_columns(df)
            col_type = col_type or col_type_inf
            col_desc = col_desc or col_desc_inf
            col_sample = col_sample or col_sample_inf

        # Skip sheets with no identifiable field column
        if not col_field:
            continue

        table_name = _norm(sheet_name)
        if col_table and col_table in df.columns:
            vals = [v for v in df[col_table].astype(str).tolist() if _norm(v)]
            if vals:
                table_name = _norm(vals[0])

        rows: List[Dict[str, Any]] = []
        for _, r in df.iterrows():
            fname = _norm(r.get(col_field, ""))
            if not fname:
                continue
            ftype = _norm(r.get(col_type, "")) if col_type else ""
            fdesc = _norm(r.get(col_desc, "")) if col_desc else ""
            fsamp = _norm(r.get(col_sample, "")) if col_sample else ""

            rows.append({
                "name": _snake(fname),
                "displayName": fname,
                "type": ftype.lower(),
                "description": fdesc,
                "sample": fsamp
            })

        if rows:
            out["tables"].setdefault(table_name, []).extend(rows)

    return out


def save_schema_json(payload: Dict[str, Any], out_dir: Path) -> Path:
    """Save parsed schema JSON to disk."""
    out_dir.mkdir(parents=True, exist_ok=True)
    bank = _snake(payload.get("bank", "bank"))
    stem = _snake(Path(payload.get("source_file", "schema")).stem)
    out_path = out_dir / f"{bank}__{stem}.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    return out_path
