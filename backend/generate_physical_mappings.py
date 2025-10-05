
import json
import re
import sqlite3
from pathlib import Path
from typing import Dict, List, Optional

BASE = Path(__file__).parent
DB_PATH = BASE / "merged_banks.db"
TABLE_MAP_FILE = BASE / "schemas" / "table_name_mapping.json"  
FIELD_MAP_FILE = BASE / "schemas" / "bank_column_mapping.json"  
OUT_FILE = BASE / "Resolved_Mappings.json"
def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", (s or "").lower()).strip("_")

def load_json(p: Path):
    if not p.exists():
        raise FileNotFoundError(f"Missing JSON file: {p}")
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)
def list_tables(conn: sqlite3.Connection) -> List[str]:
    return [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")]
def table_cols(conn: sqlite3.Connection, table: str) -> List[str]:
    return [r[1] for r in conn.execute(f'PRAGMA table_info("{table}")')]
def score_name(candidate: str, want: str) -> int:
    ctoks = set(norm(candidate).split("_"))
    wtoks = set(norm(want).split("_"))
    return len(ctoks & wtoks)

def resolve_physical_table(conn: sqlite3.Connection, bank_prefix: str, logical_name: str) -> Optional[str]:
    candidates = [t for t in list_tables(conn) if t.lower().startswith(bank_prefix.lower() + "_")]
    if not candidates:
        return None
    scored = sorted(candidates, key=lambda t: score_name(t, logical_name), reverse=True)
    return scored[0]
def main():
    if not DB_PATH.exists():
        raise FileNotFoundError(f"DB not found: {DB_PATH}")
    table_map = load_json(TABLE_MAP_FILE)   
    field_map = load_json(FIELD_MAP_FILE)   
    if not isinstance(table_map, list):
        raise ValueError("table_name_mapping.json must be a list of mapping objects.")
    if not isinstance(field_map, dict):
        raise ValueError("field_mapping.json must be a dict keyed by logical table name.")
    sample_key = next(iter(field_map.keys()), None)
    if sample_key is None or not isinstance(field_map.get(sample_key), list):
        raise ValueError(f"{FIELD_MAP_FILE} does not look like a dict of lists keyed by logical table names.")
    sample_list = field_map[sample_key]
    if sample_list and not (isinstance(sample_list[0], dict)
                            and "bank2_column" in sample_list[0]
                            and "best_match_bank1_column" in sample_list[0]):
        raise ValueError(
            f"{FIELD_MAP_FILE} does not have the expected objects with "
            f"'bank2_column' and 'best_match_bank1_column'."
        )
    out: List[Dict] = []
    unresolved_any = False
    conn = sqlite3.connect(DB_PATH)
    try:
        for pair in table_map:
            status = (pair.get("status") or "").lower()
            if status != "confident match":
                continue
            logicalA = pair.get("best_match_bank1_table") or ""
            logicalB = pair.get("bank2_table") or ""
            if not logicalA or not logicalB:
                continue
            a_tbl = resolve_physical_table(conn, "BankA", logicalA)
            b_tbl = resolve_physical_table(conn, "BankB", logicalB)
            if not a_tbl or not b_tbl:
                print(f"⚠️  Could not resolve physical tables for {logicalA} ↔ {logicalB}; skipping.")
                continue
            a_cols = table_cols(conn, a_tbl)
            b_cols = table_cols(conn, b_tbl)
            a_norm = {norm(c): c for c in a_cols}
            b_norm = {norm(c): c for c in b_cols}
            fm_key = logicalA if logicalA in field_map else max(
                field_map.keys(), key=lambda k: score_name(k, logicalA), default=None
            )
            col_pairs = field_map.get(fm_key, [])
            if not col_pairs:
                print(f"⚠️  No field mappings for {logicalA}; skipping.")
                continue
            resolved_cols = []
            unresolved = []
            for p in col_pairs:
                b2 = (p.get("bank2_column") or {})
                b1 = (p.get("best_match_bank1_column") or {})

                uni_raw = (b1.get("name") or b2.get("name") or "").strip()
                unified = re.sub(r"[^\w]+", "_", uni_raw).strip("_") or "UNIFIED"
                a_src = (b1.get("name") or "").strip()
                a_phys = a_norm.get(norm(a_src))
                b_src = (b2.get("name") or "").strip()
                b_phys = b_norm.get(norm(b_src))

                if not a_phys or not b_phys:
                    unresolved.append({
                        "unified": unified,
                        "bankA_src": a_src, "bankA_phys_found": bool(a_phys),
                        "bankB_src": b_src, "bankB_phys_found": bool(b_phys)
                    })

                typ = (b1.get("type") or b2.get("type") or "string").lower()
                if typ not in {"string", "date", "float"}:
                    typ = "string"

                resolved_cols.append({
                    "bankA": a_phys or a_src,   
                    "bankB": b_phys or b_src,
                    "unified": unified,
                    "type": typ
                })

            if unresolved:
                unresolved_any = True
                print(f"⚠️  {logicalA}: some columns did not match the physical names:")
                for u in unresolved:
                    print("   -", u)

            out.append({
                "logical_table": logicalA,
                "bankA_table": a_tbl,
                "bankB_table": b_tbl,
                "columns": resolved_cols
            })

        with open(OUT_FILE, "w", encoding="utf-8") as f:
            json.dump(out, f, indent=2)
        print(f"✅ Wrote {OUT_FILE} with {len(out)} table mappings.")
        if unresolved_any:
            print("ℹ️ Review unresolved entries above and edit Resolved_Mappings.json or Stage-3 names as needed.")

    finally:
        conn.close()

if __name__ == "__main__":
    main()
