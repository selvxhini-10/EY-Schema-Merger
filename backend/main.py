from fastapi import FastAPI, UploadFile, File
import pandas as pd
import io

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Backend is running!"}


