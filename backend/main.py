from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil

app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_file(bank: str = Form(...), file: UploadFile = File(...)):
    # Normalize bank name to full folder name
    if bank.lower() == "banka" or bank.lower() == "a":
        bank_folder = "BankA"
    elif bank.lower() == "bankb" or bank.lower() == "b":
        bank_folder = "BankB"
    else:
        return {"error": f"Invalid bank name: {bank}"}

    # Construct the absolute folder path (inside backend/BankA/uploads or backend/BankB/uploads)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    upload_dir = os.path.join(base_dir, bank_folder, "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, file.filename)

    # Save the file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print(f"✅ File saved to: {file_path}")
    return {"message": f"File uploaded successfully to {upload_dir}", "filename": file.filename}
