import os
import json
from typing import Dict, List

# Load table name mapping
with open('Table_name_mapping.json', 'r', encoding='utf-8') as f:
    all_mappings = json.load(f)

# ✅ Step 1: Keep only confident matches
confident_mappings = [
    entry for entry in all_mappings
    if entry['status'].strip().lower() == 'confident match'
]

# ✅ Step 2: Build lookup dictionaries only for confident pairs
bank2_to_logical = {
    entry['bank2_table'].lower().replace(' ', '').replace('_', ''): entry['best_match_bank1_table']
    for entry in confident_mappings
}
bank1_to_logical = {
    entry['best_match_bank1_table'].lower().replace(' ', '').replace('_', ''): entry['best_match_bank1_table']
    for entry in confident_mappings
}

def clean_name(name: str) -> str:
    return os.path.splitext(name)[0].lower().replace(' ', '').replace('_', '')

def infer_logical_table(filename: str, bank: str) -> str:
    clean_filename = clean_name(filename)
    if bank == 'BankB':
        for bank2_key, logical in bank2_to_logical.items():
            if bank2_key in clean_filename:
                return logical
    elif bank == 'BankA':
        for logical_key in bank1_to_logical:
            if logical_key in clean_filename:
                return bank1_to_logical[logical_key]
    return None

def build_merge_ready_manifest(bank_folders: Dict[str, str]) -> Dict[str, List[Dict]]:
    manifest = {}
    for bank, folder in bank_folders.items():
        for root, _, files in os.walk(folder):
            for file in files:
                if file.endswith(('.csv', '.xlsx')):
                    logical_table = infer_logical_table(file, bank)
                    rel_path = os.path.relpath(os.path.join(root, file))
                    if logical_table:
                        manifest.setdefault(logical_table, []).append({
                            "source": rel_path.replace('\\', '/'),
                            "bank": bank
                        })
                    else:
                        print(f"[⚠️ No Confident Match] {file} from {bank}")
    return manifest

if __name__ == '__main__':
    base_path = os.getcwd()
    bank_folders = {
        'BankA': os.path.join(base_path, 'BankA'),
        'BankB': os.path.join(base_path, 'BankB')
    }

    merge_manifest = build_merge_ready_manifest(bank_folders)

    output_path = os.path.join(base_path, 'merge_manifest.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(merge_manifest, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Merge-ready manifest saved to {output_path}")
    print(f"Contains {len(merge_manifest)} confident logical table groups.")
