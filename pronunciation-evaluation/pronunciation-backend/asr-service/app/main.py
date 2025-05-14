from fastapi import FastAPI, UploadFile, File,Form
from app.models.whisper_asr import WhisperASR  
import os

app = FastAPI()
asr_model = WhisperASR()

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...),text: str = Form(...)) :
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())
  
    try:
        result = asr_model.transcribe(temp_path)
        return result,text
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)