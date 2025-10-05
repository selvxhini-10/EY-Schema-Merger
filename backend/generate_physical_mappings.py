import json, re, sqlite3
from pathlib import Path
from typing import Dict, List, Optional

BASE = Path(__file__).parent
DB_PATH = BASE / "merged_banks.db"
TABLE_MAP_FILE = BASE / "schemas" / "table_name_mapping.json"
FIELD_MAP_FILE = BASE / "schemas" / "bank_column_mapping.json"
OUT_FILE = BASE / "Resolved_Mappings.json"

INCLUDE_NEEDS_REVIEW = True  
USE_SQLITE_IF_PRESENT = True   
BANKA_PREFIXES = ["BankA", "Bank_A", "banka"]
BANKB_PREFIXES = ["BankB", "Bank_B", "bankb"]

def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", (s or "").lower()).strip("_")

def unify(s: str) -> str:
    u = re.sub(r"[^\w]+", "_", (s or "")).strip("_")
    return u or "UNIFIED"

def load_json(p: Path):
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)

def list_tables(conn: sqlite3.Connection) -> List[str]:
    return [r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )]

def table_cols(conn: sqlite3.Connection, table: str) -> List[str]:
    return [r[1] for r in conn.execute(f'PRAGMA table_info("{table}")')]

def score_name(candidate: str, want: str) -> int:
    ctoks = set(norm(candidate).split("_"))
    wtoks = set(norm(want).split("_"))
    return len(ctoks & wtoks)

def best_prefix_tables(all_tables: List[str], prefixes: List[str]) -> List[str]:
    pn = [norm(p) for p in prefixes]
    out = []
    for t in all_tables:
        tn = norm(t)
        if any(tn.startswith(p + "_") or tn.startswith(p) for p in pn):
            out.append(t)
    return out

def resolve_table(conn: sqlite3.Connection, logical_name: str, prefixes: List[str]) -> Optional[str]:
    cands = best_prefix_tables(list_tables(conn), prefixes)
    if not cands:
        return None
    return sorted(cands, key=lambda t: score_name(t, logical_name), reverse=True)[0]

def snap_label_to_physical(label: str, phys_cols: List[str]) -> str:
    if not phys_cols or not label:
        return label
    best = max(phys_cols, key=lambda c: score_name(c, label))
    return best if score_name(best, label) > 0 else label

def pick(d: Dict, *keys: str) -> str:
    for k in keys:
        v = d.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""

def main():
    table_map = load_json(TABLE_MAP_FILE)     
    field_map = load_json(FIELD_MAP_FILE)     
    conn = None
    if USE_SQLITE_IF_PRESENT and DB_PATH.exists():
        conn = sqlite3.connect(DB_PATH)

    out = []
    produced = 0

    for idx, row in enumerate(table_map, 1):
        status = (row.get("status") or "").lower()
        if not INCLUDE_NEEDS_REVIEW and status != "confident match":
            continue

        logicalA = pick(row, "best_match_bank1_table", "bank1_table", "Bank1_Table")
        logicalB = pick(row, "bank2_table", "Bank2_Table")
        if not logicalA and not logicalB:
            continue
        fm_key = logicalA or logicalB
        pairs = field_map.get(fm_key, [])
        if not isinstance(pairs, list) or not pairs:
            if isinstance(field_map, dict) and field_map:
                keys = list(field_map.keys())
                fm_key2 = max(keys, key=lambda k: score_name(k, fm_key or k))
                if score_name(fm_key2, fm_key) > 0:
                    pairs = field_map.get(fm_key2, [])
        if not pairs:
            out.append({
                "logical_table": logicalA or logicalB,
                "bankA_table": None,
                "bankB_table": None,
                "columns": []
            })
            produced += 1
            continue
        a_tbl = b_tbl = None
        a_cols = b_cols = []
        if conn is not None:
            a_tbl = resolve_table(conn, logicalA or logicalB, BANKA_PREFIXES)
            b_tbl = resolve_table(conn, logicalB or logicalA, BANKB_PREFIXES)
            if a_tbl: a_cols = table_cols(conn, a_tbl)
            if b_tbl: b_cols = table_cols(conn, b_tbl)

        resolved_cols = []
        for p in pairs:
            b2 = p.get("bank2_column") or {}
            b1 = p.get("best_match_bank1_column") or {}
            a_label = (b1.get("label") or "").strip()
            b_label = (b2.get("label") or "").strip()

            unified = unify(a_label or b_label)
            typ = (b1.get("type") or b2.get("type") or "string").lower()
            if typ not in {"string", "float", "date"}:
                typ = "string"
            a_phys = snap_label_to_physical(a_label, a_cols) if a_cols else a_label
            b_phys = snap_label_to_physical(b_label, b_cols) if b_cols else b_label

            resolved_cols.append({
                "bankA": a_phys or a_label,
                "bankB": b_phys or b_label,
                "unified": unified,
                "type": typ
            })

        out.append({
            "logical_table": logicalA or logicalB,
            "bankA_table": a_tbl,
            "bankB_table": b_tbl,
            "columns": resolved_cols
        })
        produced += 1

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)

    print(f"✅ Wrote {OUT_FILE} with {produced} table(s).")
    if produced == 0:
        print("🚨 Zero produced. Check that table_name_mapping.json is a LIST and bank_column_mapping.json is a DICT keyed by logical table.")

if __name__ == "__main__":
    main()
