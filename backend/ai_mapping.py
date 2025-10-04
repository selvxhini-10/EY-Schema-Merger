from sentence_transformers import SentenceTransformer, util
import torch
import json

# *** COMPARING TABLE NAMES ***
# ==== CONFIG ====
FILE1 = "backend/Bank1_Schema_EYExample.json"
FILE2 = "backend/Bank2_Schema_EYExample.json"
CONF_THRESHOLD = 60.0
MODEL_NAME = "all-MiniLM-L6-v2"

# ==== LOAD MODEL ====
model = SentenceTransformer(MODEL_NAME)

# ==== LOAD JSON FILES ====
with open(FILE1, "r", encoding="utf-8") as f:
    data1 = json.load(f)

with open(FILE2, "r", encoding="utf-8") as f:
    data2 = json.load(f)

# ==== EXTRACT TABLE NAMES ====
tables1 = list(data1["tables"].keys())
tables2 = list(data2["tables"].keys())

# ==== ENCODE ====
embeddings1 = model.encode(tables1, convert_to_tensor=True)
embeddings2 = model.encode(tables2, convert_to_tensor=True)

# ==== COSINE SIMILARITY ====
cosine_scores = util.cos_sim(embeddings2, embeddings1)

# ==== MATCHING LOOP ====
results = []

for i, table2 in enumerate(tables2):
    probs = torch.softmax(cosine_scores[i], dim=0)
    best_idx = probs.argmax().item()
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

# ==== RENAME TABLES IN Bank2 JSON ====
table_mapping = [r for r in results if r["status"] == "Confident Match"]
rename_dict = {m["bank2_table"]: m["best_match_bank1_table"] for m in table_mapping}

# Original tables dict in Bank2
tables2 = data2["tables"]

# Create a new dict with renamed keys
renamed_tables = {}
for old_name, columns in tables2.items():
    new_name = rename_dict.get(old_name, old_name)  # default to old name if no match
    renamed_tables[new_name] = columns

# Replace tables in Bank2
data2["tables"] = renamed_tables


# ==== SAVE RESULTS ====
with open("backend/Bank2_Renamed_Schema.json", "w", encoding="utf-8") as f:
    json.dump(data2, f, indent=2, ensure_ascii=False)

print("✅ Bank2 tables renamed and saved to Bank2_Renamed_Schema.json")

with open("backend/Table_name_mapping.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print("✅ Table name mapping saved to Table_name_mapping.json")

# *** COMPARING HEADERS WITHIN EACH MATCHING TABLE ***

# ==== CONFIG ====
BANK1_FILE = "backend/Bank1_Schema_EYExample.json"
BANK2_FILE = "backend/Bank2_Renamed_Schema.json"
TEXT_KEY = "description"  # field to compare semantically

# ==== HELPER FUNCTION ====
def map_columns(list1, list2, text_key=TEXT_KEY, conf_threshold=CONF_THRESHOLD):
    """
    Map columns from list2 to list1 using SBERT semantic similarity.
    list1, list2: list of dicts containing 'description' field
    """
    lines1 = [col[text_key] for col in list1]
    lines2 = [col[text_key] for col in list2]

    embeddings1 = model.encode(lines1, convert_to_tensor=True)
    embeddings2 = model.encode(lines2, convert_to_tensor=True)

    cosine_scores = util.cos_sim(embeddings2, embeddings1)
    results = []

    for i, col2 in enumerate(list2):
        probs = torch.softmax(cosine_scores[i], dim=0)
        best_idx = probs.argmax().item()
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

# ==== LOAD JSON FILES ====
with open(BANK1_FILE, "r", encoding="utf-8") as f:
    bank1 = json.load(f)

with open(BANK2_FILE, "r", encoding="utf-8") as f:
    bank2 = json.load(f)

# ==== PROCESS EACH TABLE ====
mapping_results = {}

for table_name, columns2 in bank2["tables"].items():
    # Only map if the table exists in bank1
    columns1 = bank1["tables"].get(table_name)
    if not columns1:
        print(f"Warning: Table '{table_name}' not found in Bank1. Skipping...")
        continue

    # Map columns
    mapped_columns = map_columns(columns1, columns2)
    mapping_results[table_name] = mapped_columns

# ==== SAVE RESULTS ====
with open("backend/Bank_column_mapping.json", "w", encoding="utf-8") as f:
    json.dump(mapping_results, f, indent=2, ensure_ascii=False)

print(f"✅ Column mapping results saved to Bank_column_mapping.json")
print("Hi")