import sqlite3
import pandas as pd
import json
from pathlib import Path
from datetime import datetime

#config!!!
BASE_DIR = Path(__file__).parent
#this is the raw data table that in SQLITE3 that has all the tables of excel spreadsheet data
RAW_DB = BASE_DIR / "data_raw.db"   
#this is the unified database we will have after creating the unified database    
UNIFIED_DB = BASE_DIR / "unified_data" / "unified.db"
#this is the field mappings which display the columns in each bank 1 and bank 2 and which columns connect to each other 
FIELD_MAP_FILE = BASE_DIR / "Bank_column_mapping.json"
#this is the table mapping which displays the tables in each bank 1 and bank 2 and which tables connect to each othe 
TABLE_MAP_FILE = BASE_DIR / "mappings" / "Table_name_mapping.json"
#logs
LOG_DIR = BASE_DIR / "logs"
UNIFIED_DB.parent.mkdir(exist_ok=True, parents=True)
LOG_DIR.mkdir(exist_ok=True, parents=True)


def load_json(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"{path.name} missing")
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def connect_raw():
    if not RAW_DB.exists():
        raise FileNotFoundError("Stage 4 SQLite data_raw.db not found.")
    return sqlite3.connect(RAW_DB)

def build_table_rename(sqlite_tables, table_map):
    rename = {}
    for m in table_map:
        if m.get("status") != "Confident Match":
            continue
        b2 = m["bank2_table"].replace(" ", "_").lower()
        b1 = m["best_match_bank1_table"].replace(" ", "_").lower()
        for t in sqlite_tables:
            if t.lower().startswith("bankb_") and b2 in t.lower():
                rename[t] = t.replace(b2, b1)
    return rename


def build_field_rename(table_name, field_map):
    rename_a, rename_b = {}, {}
    for m in field_map:
        if m["table"].replace(" ", "_").lower() == table_name.lower():
            unified = m["UnifiedField"]
            if m.get("BankA"):
                rename_a[m["BankA"]] = unified
            if m.get("BankB"):
                rename_b[m["BankB"]] = unified
    return rename_a, rename_b
def clean_and_standardize(df: pd.DataFrame) -> pd.DataFrame:
    for c in df.columns:
        cl = c.lower()
        if "date" in cl:
            df[c] = pd.to_datetime(df[c], errors="coerce")
        elif any(k in cl for k in ["amount","balance","rate","interest","principal"]):
            df[c] = pd.to_numeric(df[c], errors="coerce")
        elif "id" in cl:
            df[c] = df[c].astype(str).str.upper().str.strip()
        else:
            df[c] = df[c].astype(str).str.strip()
    return df
def run_stage5_transformation():
    table_map = load_json(TABLE_MAP_FILE)
    field_map = load_json(FIELD_MAP_FILE)
    summary = {}

    with connect_raw() as conn_in, sqlite3.connect(UNIFIED_DB) as conn_out:
        sqlite_tables = pd.read_sql_query(
            "SELECT name FROM sqlite_master WHERE type='table';", conn_in
        )["name"].tolist()

        rename_tables = build_table_rename(sqlite_tables, table_map)

        for m in table_map:
            if m["status"] != "Confident Match":
                continue

            table_key = m["best_match_bank1_table"].replace(" ", "_")
            tableA = next((t for t in sqlite_tables if t.lower().startswith("banka_") and table_key.lower() in t.lower()), None)
            tableB = next((t for t in sqlite_tables if t.lower().startswith("bankb_") and m["bank2_table"].replace(" ", "_").lower() in t.lower()), None)
            if not tableA or not tableB:
                continue

            rename_a, rename_b = build_field_rename(table_key, field_map)
            dfA = pd.read_sql_query(f'SELECT * FROM "{tableA}"', conn_in)
            dfB = pd.read_sql_query(f'SELECT * FROM "{tableB}"', conn_in)

            dfA.rename(columns=rename_a, inplace=True)
            dfB.rename(columns=rename_b, inplace=True)
            dfA, dfB = clean_and_standardize(dfA), clean_and_standardize(dfB)

            for col in set(dfA.columns) - set(dfB.columns):
                dfB[col] = None
            for col in set(dfB.columns) - set(dfA.columns):
                dfA[col] = None
            cols = sorted(dfA.columns)
            dfA, dfB = dfA[cols], dfB[cols]

            dfA.to_sql(f"BankA_{table_key}_unified", conn_out, if_exists="replace", index=False)
            dfB.to_sql(f"BankB_{table_key}_unified", conn_out, if_exists="replace", index=False)

            summary[table_key] = {
                "columns_standardized": list(cols),
                "rows_BankA": len(dfA),
                "rows_BankB": len(dfB),
                "timestamp": datetime.utcnow().isoformat()
            }

    with open(LOG_DIR / "transformation_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print("✅ Stage 5 complete →", UNIFIED_DB)
    return summary
