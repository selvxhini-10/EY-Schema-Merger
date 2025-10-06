def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", (s or "").lower()).strip("_")

def table_exists(conn, name: str) -> bool:
    return conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (name,)
        ).fetchone() is not None

def list_cols(conn, table: str) -> list[str]:
    return [r[1] for r in conn.execute(f'PRAGMA table_info("{table}")')]


def run_transform_unified():
    import json, sqlite3, re
    from pathlib import Path
    from datetime import datetime
    import pandas as pd

    BASE = Path(__file__).parent
    DB_PATH = BASE / "merged_banks.db"
    RESOLVED_FILE = BASE / "Resolved_Mappings.json"
    UNIFIED_PREFIX = "Unified_"
    MANIFEST_FILE = BASE / "Stage5_Manifest.json"

    def norm(s: str) -> str:
        return re.sub(r"[^a-z0-9]+", "_", (s or "").lower()).strip("_")

    def table_exists(conn, name: str) -> bool:
        return conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (name,)
        ).fetchone() is not None

    def list_cols(conn, table: str) -> list[str]:
        return [r[1] for r in conn.execute(f'PRAGMA table_info("{table}")')]

    def select_cols(conn, table: str, cols: list[str]) -> pd.DataFrame:
        if not cols:
            return pd.DataFrame()
        existing = {r[1] for r in conn.execute(f'PRAGMA table_info("{table}")')}
        use = [c for c in cols if c in existing]
        if not use:
            return pd.DataFrame()
        col_list = ", ".join(f'"{c}"' for c in use)
        return pd.read_sql_query(f'SELECT {col_list} FROM "{table}"', conn)

    def cast_types(df: pd.DataFrame, type_spec: dict[str, str]) -> pd.DataFrame:
        if df.columns.duplicated().any():
            df = df.loc[:, ~df.columns.duplicated()].copy()
        for col, t in type_spec.items():
            if col not in df.columns:
                continue
            s = df[col]
            t = (t or "string").lower()
            if t == "string":
                s = s.astype("string").str.strip()
            elif t == "float":
                s = pd.to_numeric(s, errors="coerce")
            elif t == "date":
                s = pd.to_datetime(s, errors="coerce", infer_datetime_format=True)
            df[col] = s
        return df

    def build_mappings_from_resolved(spec: dict, a_cols: list[str], b_cols: list[str]):
        cols_meta = spec.get("columns", [])
        dropped, types, good = [], {}, []
        a_set, b_set = set(a_cols), set(b_cols)

        for c in cols_meta:
            unified = (c.get("unified") or "").strip()
            a_phys = (c.get("bankA") or "").strip() or None
            b_phys = (c.get("bankB") or "").strip() or None

            if not unified or unified.upper() == "UNIFIED":
                dropped.append({**c, "reason": "placeholder_unified"})
                continue

            a_ok = bool(a_phys and a_phys in a_set)
            b_ok = bool(b_phys and b_phys in b_set)
            if not (a_ok or b_ok):
                dropped.append({**c, "reason": "no_physical_source_found"})
                continue

            good.append((a_phys if a_ok else None, b_phys if b_ok else None, unified))
            types[unified] = (c.get("type") or "string").lower()

        return good, dropped, types

    def auto_infer_mappings_using_intersection(a_cols: list[str], b_cols: list[str]):
        a_map = {norm(c): c for c in a_cols}
        b_map = {norm(c): c for c in b_cols}
        shared_keys = sorted(set(a_map.keys()) & set(b_map.keys()))
        good = []
        for k in shared_keys:
            a_phys, b_phys = a_map[k], b_map[k]
            unified = a_phys
            good.append((a_phys, b_phys, unified))
        types = {u: "string" for _, _, u in good}
        return good, types

    def collapse_rename(d: dict) -> dict:
        out, seen = {}, set()
        for src, uni in d.items():
            if uni in seen:
                continue
            seen.add(uni)
            out[src] = uni
        return out

    print("[transform_unified] Starting unified transformation...")
    if not DB_PATH.exists():
        print(f"[transform_unified] DB not found: {DB_PATH}")
        BASE = Path(__file__).parent
        DB_PATH = BASE / "merged_banks.db"
        RESOLVED_FILE = BASE / "Resolved_Mappings.json"
        UNIFIED_PREFIX = "Unified_"
        MANIFEST_FILE = BASE / "Stage5_Manifest.json"
    resolved = json.loads(Path(RESOLVED_FILE).read_text(encoding="utf-8"))
    if not isinstance(resolved, list) or not resolved:
        print("[transform_unified] Resolved_Mappings.json is empty or not a list.")
        return False

    conn = sqlite3.connect(DB_PATH)
    created, inferred, dropped_cols, empties = [], [], [], []

    try:
        for spec in resolved:
            logical = spec.get("logical_table") or "Unknown"
            a_tbl = spec.get("bankA_table")
            b_tbl = spec.get("bankB_table")

            if not (a_tbl and b_tbl) or not (table_exists(conn, a_tbl) and table_exists(conn, b_tbl)):
                print(f"[transform_unified] ⚠️  {logical}: physical tables missing in SQLite; skipping")
                continue

            a_cols = list_cols(conn, a_tbl)
            b_cols = list_cols(conn, b_tbl)

            good, dropped, types = build_mappings_from_resolved(spec, a_cols, b_cols)
            if not good:
                good, types = auto_infer_mappings_using_intersection(a_cols, b_cols)
                if good:
                    inferred.append(logical)
                    print(f"[transform_unified] ℹ️  {logical}: no usable mappings; AUTO-INFER matched {len(good)} columns by name.")

            unified_name = UNIFIED_PREFIX + re.sub(r"[^A-Za-z0-9]+", "_", logical).strip("_")

            if not good:
                pd.DataFrame(columns=["bank_origin"]).to_sql(unified_name, conn, if_exists="replace", index=False)
                print(f"[transform_unified] 🟡 {logical}: no columns matched — wrote empty marker {unified_name}")
                empties.append(unified_name)
                continue

            a_sel = [a for (a, _, _) in good if a]
            b_sel = [b for (_, b, _) in good if b]
            a_rename_raw = {a: u for (a, _, u) in good if a}
            b_rename_raw = {b: u for (_, b, u) in good if b}
            a_rename = collapse_rename(a_rename_raw)
            b_rename = collapse_rename(b_rename_raw)

            unified_cols = sorted({u for (_, _, u) in good})

            dfA = select_cols(conn, a_tbl, a_sel)
            dfB = select_cols(conn, b_tbl, b_sel)

            if not dfA.empty:
                dfA.rename(columns=a_rename, inplace=True)
                if dfA.columns.duplicated().any():
                    print(f"[transform_unified] ℹ️  {logical}: BankA produced duplicate unified columns; keeping first occurrence.")
                    dfA = dfA.loc[:, ~dfA.columns.duplicated()].copy()
                dfA["bank_origin"] = "BankA"
                dfA = dfA.reindex(columns=unified_cols + ["bank_origin"])

            if not dfB.empty:
                dfB.rename(columns=b_rename, inplace=True)
                if dfB.columns.duplicated().any():
                    print(f"[transform_unified] ℹ️  {logical}: BankB produced duplicate unified columns; keeping first occurrence.")
                    dfB = dfB.loc[:, ~dfB.columns.duplicated()].copy()
                dfB["bank_origin"] = "BankB"
                dfB = dfB.reindex(columns=unified_cols + ["bank_origin"])

            unified_df = pd.concat([dfA, dfB], ignore_index=True)

            if unified_df.columns.duplicated().any():
                print(f"[transform_unified] ℹ️  {logical}: Deduplicating unified columns after concat; keeping first.")
                unified_df = unified_df.loc[:, ~unified_df.columns.duplicated()].copy()

            if unified_df.empty:
                pd.DataFrame(columns=unified_cols + ["bank_origin"]).to_sql(unified_name, conn, if_exists="replace", index=False)
                print(f"[transform_unified] 🟡 {logical}: no rows found but columns matched — wrote empty structure {unified_name}")
                empties.append(unified_name)
                continue

            unified_df = cast_types(unified_df, types)
            unified_df.to_sql(unified_name, conn, if_exists="replace", index=False)

            print(
                f"[transform_unified] ✅ {logical}: wrote {unified_name} — rows={len(unified_df)}, "
                f"cols={len(unified_df.columns)-1}"
                f"{' (auto-inferred)' if logical in inferred else ''}"
                f"{f', dropped={len(dropped)} unresolved' if dropped else ''}"
            )

            if dropped:
                dropped_cols.append({"logical_table": logical, "dropped": dropped})

            created.append({
                "logical_table": logical,
                "table": unified_name,
                "rows": len(unified_df),
                "cols": len(unified_df.columns) - 1
            })

        manifest = {
            "timestamp": datetime.now().isoformat(),
            "db_path": str(DB_PATH),
            "created": created,
            "auto_inferred_tables": inferred,
            "empty_outputs": empties,
            "dropped_unresolved_columns": dropped_cols
        }
        Path(MANIFEST_FILE).write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        print(f"\n[transform_unified] 🏯 Stage 5 complete.\n[transform_unified] 🧾 Manifest: {MANIFEST_FILE}")

    finally:
        conn.close()
    print("[transform_unified] Done.")
    return True

if __name__ == "__main__":
    run_transform_unified()
