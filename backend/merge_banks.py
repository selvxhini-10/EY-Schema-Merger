import pandas as pd
import sqlite3
import json
from pathlib import Path
from datetime import datetime

# === CONFIG ===
BASE_DIR = Path(__file__).parent  # folder where merge_banks.py lives
BANK_A_DIR = BASE_DIR / "BankA" / "uploads"
BANK_B_DIR = BASE_DIR / "BankB" / "uploads"
DB_PATH = BASE_DIR / "merged_banks.db"
MAPPING_FILE = BASE_DIR / "Table_name_mapping.json"  # your mapping JSON
MANIFEST_FILE = BASE_DIR / "manifest.json"

# === STEP 1: Load the mapping JSON ===
if not MAPPING_FILE.exists():
    raise FileNotFoundError(f"Mapping file not found at {MAPPING_FILE}")
with open(MAPPING_FILE, "r") as f:
    mappings = json.load(f)

confident_matches = [m for m in mappings if m.get("status") == "Confident Match"]

# === HELPER FUNCTION ===
def normalize_name(name: str) -> str:
    """Replace spaces, slashes, and hyphens with underscores."""
    return name.strip().replace(" ", "_").replace("-", "_").replace("/", "_")

# === MANIFEST ===
manifest = {
    "timestamp": datetime.now().isoformat(),
    "db_path": str(DB_PATH),
    "banks_loaded": [],
    "merged_tables": [],
    "skipped_merges": []
}

# === STEP 2: Connect to SQLite ===
conn = sqlite3.connect(DB_PATH)

# === STEP 3: Load bank files into SQLite ===
def load_bank_data(bank_name, input_dir):
    tables_added = []

    if not input_dir.exists():
        print(f"⚠️ Directory does not exist: {input_dir}")
        return tables_added

    for file in input_dir.glob("*"):
        try:
            if file.suffix.lower() in [".xlsx", ".xls"]:
                xls = pd.ExcelFile(file)
                for sheet in xls.sheet_names:
                    df = pd.read_excel(file, sheet_name=sheet)
                    df["bank_origin"] = bank_name
                    # Use both filename and sheet name for uniqueness
                    table_name = f"{bank_name}_{normalize_name(file.stem)}_{normalize_name(sheet)}"
                    df.to_sql(table_name, conn, if_exists="replace", index=False)
                    tables_added.append(table_name)
                    print(f"✅ Loaded sheet '{sheet}' from '{file.name}' as table '{table_name}' ({len(df)} rows)")
            elif file.suffix.lower() == ".csv":
                df = pd.read_csv(file)
                df["bank_origin"] = bank_name
                table_name = f"{bank_name}_{normalize_name(file.stem)}"
                df.to_sql(table_name, conn, if_exists="replace", index=False)
                tables_added.append(table_name)
                print(f"✅ Loaded CSV '{file.name}' as table '{table_name}' ({len(df)} rows)")
            else:
                print(f"⚠️ Skipping unsupported file type: {file.name}")
        except Exception as e:
            print(f"⚠️ Failed to load {file.name}: {e}")

    return tables_added

# Load both banks
print("📥 Loading BankA data...")
bankA_tables = load_bank_data("BankA", BANK_A_DIR)

print("📥 Loading BankB data...")
bankB_tables = load_bank_data("BankB", BANK_B_DIR)

manifest["banks_loaded"].append({
    "bank_name": "BankA",
    "tables_added": bankA_tables,
    "total_tables": len(bankA_tables)
})
manifest["banks_loaded"].append({
    "bank_name": "BankB",
    "tables_added": bankB_tables,
    "total_tables": len(bankB_tables)
})


# === STEP 4: Auto-merge confident matches ===
# (Commented out for debugging: Only load all Excel/CSV files into SQLite, no merging or filtering)
# for match in confident_matches:
#     bank1_table = f"BankA_{normalize_name(match['best_match_bank1_table'])}"
#     bank2_table = f"BankB_{normalize_name(match['bank2_table'])}"
#     merged_table = f"Merged_{normalize_name(match['best_match_bank1_table'])}"
#
#     entry = {
#         "bank1_table": bank1_table,
#         "bank2_table": bank2_table,
#         "merged_table": merged_table,
#         "status": "Success",
#         "records_merged": 0
#     }
#
#     try:
#         df_a = pd.read_sql_query(f"SELECT * FROM {bank1_table}", conn)
#         df_b = pd.read_sql_query(f"SELECT * FROM {bank2_table}", conn)
#
#         # Keep only shared columns
#         shared_cols = list(set(df_a.columns).intersection(df_b.columns))
#         df_a = df_a[shared_cols]
#         df_b = df_b[shared_cols]
#
#         merged_df = pd.concat([df_a, df_b], ignore_index=True)
#         merged_df.to_sql(merged_table, conn, if_exists="replace", index=False)
#
#         entry["records_merged"] = len(merged_df)
#         print(f"✅ Created merged table '{merged_table}' with {len(merged_df)} rows")
#         manifest["merged_tables"].append(entry)
#
#     except Exception as e:
#         entry["status"] = f"Failed: {e}"
#         print(f"⚠️ Skipped merging {bank1_table} + {bank2_table}: {e}")
#         manifest["skipped_merges"].append(entry)

# === STEP 5: Save manifest and close DB ===
with open(MANIFEST_FILE, "w") as f:
    json.dump(manifest, f, indent=2)

conn.close()
print(f"\n✅ All data stored in {DB_PATH}")
print(f"🧾 Manifest saved to {MANIFEST_FILE}")
