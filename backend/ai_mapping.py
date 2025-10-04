from sentence_transformers import SentenceTransformer, util
import torch
import json

# ==== CONFIG ====
FILE1 = "backend/Bank1_Schema_EYExample.json"
FILE2 = "backend/Bank2_Schema_EYExample.json"
CONF_THRESHOLD = 20.0
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
    confidence = probs[best_idx].item() * 100
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

print("Bank2 tables renamed and saved to Bank2_Renamed_Schema.json")

with open("backend/Table_name_mapping.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print("Table name mapping saved to Table_name_mapping.json")


