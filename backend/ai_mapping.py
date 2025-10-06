def run_ai_mapping(bank1_file, bank2_file, save_folder):
    print(f"[ai_mapping] Starting AI mapping...")
    result = auto_map(bank1_file, bank2_file, save_folder)
    print(f"[ai_mapping] AI mapping complete. Results saved to {save_folder}")
    return result
# ai_mapping.py
from sentence_transformers import SentenceTransformer, util
import torch
import json
import os

MODEL_NAME = "all-MiniLM-L6-v2"
CONF_THRESHOLD = 73.0
TEXT_KEY = "description"

model = SentenceTransformer(MODEL_NAME)

def load_json(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(data, file_path):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def map_table_names(bank1_json, bank2_json):
    tables1 = list(bank1_json["tables"].keys())
    tables2 = list(bank2_json["tables"].keys())

    embeddings1 = model.encode(tables1, convert_to_tensor=True)
    embeddings2 = model.encode(tables2, convert_to_tensor=True)
    cosine_scores = util.cos_sim(embeddings2, embeddings1)

    results = []
    rename_dict = {}
    for i, table2 in enumerate(tables2):
        best_idx = cosine_scores[i].argmax().item()
        best_score = cosine_scores[i][best_idx].item()
        confidence = best_score * 100
        status = "Needs Review" if confidence < CONF_THRESHOLD else "Confident Match"
        table1 = tables1[best_idx]

        results.append({
            "bank2_table": table2,
            "best_match_bank1_table": table1,
            "cosine_similarity": round(best_score, 4),
            "confidence_rating": round(confidence, 2),
            "status": status
        })

        if status == "Confident Match":
            rename_dict[table2] = table1

    return results, rename_dict

def rename_bank2_tables(bank2_json, rename_dict):
    tables2 = bank2_json["tables"]
    renamed_tables = {rename_dict.get(k, k): v for k, v in tables2.items()}
    bank2_json["tables"] = renamed_tables
    return bank2_json

def map_columns(list1, list2, text_key=TEXT_KEY, conf_threshold=CONF_THRESHOLD):
    lines1 = [col[text_key] for col in list1]
    lines2 = [col[text_key] for col in list2]

    embeddings1 = model.encode(lines1, convert_to_tensor=True)
    embeddings2 = model.encode(lines2, convert_to_tensor=True)

    cosine_scores = util.cos_sim(embeddings2, embeddings1)
    results = []

    for i, col2 in enumerate(list2):
        best_idx = cosine_scores[i].argmax().item()
        best_score = cosine_scores[i][best_idx].item()
        confidence = best_score * 100
        status = "Needs Review" if confidence < conf_threshold else "Confident Match"
        col1 = list1[best_idx]

        results.append({
            "bank2_column": col2,
            "best_match_bank1_column": col1,
            "cosine_similarity": round(best_score, 4),
            "confidence_rating": round(confidence, 2),
            "status": status
        })
    return results

def auto_map(bank1_file, bank2_file, save_folder):
    # Load schemas
    bank1_json = load_json(bank1_file)
    bank2_json = load_json(bank2_file)

    # Table mapping
    table_mapping, rename_dict = map_table_names(bank1_json, bank2_json)
    renamed_bank2 = rename_bank2_tables(bank2_json, rename_dict)

    # Column mapping
    column_mapping_results = {}
    for table_name, columns2 in renamed_bank2["tables"].items():
        columns1 = bank1_json["tables"].get(table_name)
        if not columns1:
            continue
        mapped_columns = map_columns(columns1, columns2)
        column_mapping_results[table_name] = mapped_columns

    # Save outputs
    save_json(renamed_bank2, os.path.join(save_folder, "bank2_renamed_schema.json"))
    save_json(table_mapping, os.path.join(save_folder, "table_name_mapping.json"))
    save_json(column_mapping_results, os.path.join(save_folder, "bank_column_mapping.json"))
        

    return {
        "column_mapping": column_mapping_results
    }
