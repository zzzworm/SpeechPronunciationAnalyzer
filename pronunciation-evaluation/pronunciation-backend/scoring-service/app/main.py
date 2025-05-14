from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.scorer import PronunciationScorer 

app = FastAPI()
scorer = PronunciationScorer()

class PhonemeData(BaseModel):
    phoneme: str
    start: float
    end: float

class WordAlignment(BaseModel):
    word: str
    start: float
    end: float
    phonemes: List[PhonemeData]

class AlignmentData(BaseModel):
    alignment: List[WordAlignment]
    expected_phonemes: List[str]
    alignment_textgrid_path: Optional[str] = None

@app.post("/score")
async def score_pronunciation(data: AlignmentData):
    try:
        result = scorer.score(data.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error scoring pronunciation: {str(e)}")
