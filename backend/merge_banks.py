import pandas as pd
import sqlite3
import json
from pathlib import Path
from datetime import datetime

def normalize_name(name: str) -> str:
    """Replace spaces, slashes, and hyphens with underscores."""
    return name.strip().replace(" ", "_").replace("-", "_").replace("/", "_")

def run_merge_banks():
    print("[merge_banks] Starting merge...")
    BASE_DIR = Path(__file__).parent
    BANK_A_DIR = BASE_DIR / "BankA/uploads"
    BANK_B_DIR = BASE_DIR / "BankB/uploads"
    DB_PATH = BASE_DIR / "merged_banks.db"
    MAPPING_FILE = BASE_DIR / "schemas/table_name_mapping.json"
    MANIFEST_FILE = BASE_DIR / "mansifest.json"

    if not MAPPING_FILE.exists():
        print(f"[merge_banks] Mapping file not found at {MAPPING_FILE}")
        return False
    with open(MAPPING_FILE, "r") as f:
        mappings = json.load(f)
    confident_matches = [m for m in mappings if m.get("status") == "Confident Match"]

    manifest = {
        "timestamp": datetime.now().isoformat(),
        "db_path": str(DB_PATH),
        "banks_loaded": [],
        "merged_tables": [],
        "skipped_merges": []
    }

    conn = sqlite3.connect(DB_PATH)

    def load_bank_data(bank_name, input_dir):
        tables_added = []
        if not input_dir.exists():
            print(f"[merge_banks] Directory does not exist: {input_dir}")
            return tables_added
        for file in input_dir.glob("*"):
            try:
                if file.suffix.lower() in [".xlsx", ".xls"]:
                    xls = pd.ExcelFile(file)
                    for sheet in xls.sheet_names:
                        df = pd.read_excel(file, sheet_name=sheet)
                        df["bank_origin"] = bank_name
                        table_name = f"{bank_name}_{normalize_name(file.stem)}_{normalize_name(sheet)}"
                        df.to_sql(table_name, conn, if_exists="replace", index=False)
                        tables_added.append(table_name)
                        print(f"[merge_banks] Loaded sheet '{sheet}' from '{file.name}' as table '{table_name}' ({len(df)} rows)")
                elif file.suffix.lower() == ".csv":
                    df = pd.read_csv(file)
                    df["bank_origin"] = bank_name
                    table_name = f"{bank_name}_{normalize_name(file.stem)}"
                    df.to_sql(table_name, conn, if_exists="replace", index=False)
                    tables_added.append(table_name)
                    print(f"[merge_banks] Loaded CSV '{file.name}' as table '{table_name}' ({len(df)} rows)")
                else:
                    print(f"[merge_banks] Skipping unsupported file type: {file.name}")
            except Exception as e:
                print(f"[merge_banks] Failed to load {file.name}: {e}")
        return tables_added

    print("[merge_banks] Loading BankA data...")
    bankA_tables = load_bank_data("BankA", BANK_A_DIR)
    print("[merge_banks] Loading BankB data...")
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

    # (Optional: merging logic can be added here)

    with open(MANIFEST_FILE, "w") as f:
        json.dump(manifest, f, indent=2)

    conn.close()
    print(f"[merge_banks] All data stored in {DB_PATH}")
    print(f"[merge_banks] Manifest saved to {MANIFEST_FILE}")
    print("[merge_banks] Done.")
    return True

if __name__ == "__main__":
    run_merge_banks()