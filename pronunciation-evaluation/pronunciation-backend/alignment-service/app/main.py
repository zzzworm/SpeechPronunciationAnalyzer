
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from pydantic import BaseModel
from pathlib import Path

from app.aligner import PhonemeAligner         

app = FastAPI()
aligner = PhonemeAligner()
class AlignResponse(BaseModel):
    alignment: list
    expected_phonemes: list[str]
    alignment_textgrid_path: str


@app.post("/align", response_model=AlignResponse)
async def align_audio(file: UploadFile = File(...), text: str = Form(...),reftext:str=Form(...)):
    """
    • file: WAV/PCM16/mono/16 kHz  
    • text: reference transcript
    • reftext: reference text
    """
    try:
        data = aligner.align_audio_with_text(await file.read(), text,reftext)
        return data
    except Exception as e:
        raise HTTPException(500, f"Alignment error: {e}")
