from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import requests 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ASR_SERVICE_URL = "http://localhost:8001/transcribe"  
ALIGNMENT_SERVICE_URL = "http://localhost:8002/align" 
SCORING_SERVICE_URL = "http://localhost:8003/score"  

@app.post("/api/v1/analyze")
async def analyze_pronunciation(audio_file: UploadFile = File(...), text: str = Form(...)):
    try:
       
        if not audio_file or not text:
         
            raise HTTPException(status_code=422, detail="Missing audio file or reference text")
        
        audio_content = await audio_file.read()
        asr_response = requests.post(ASR_SERVICE_URL, files={"file": audio_content},data={"text":text})
      
        if asr_response.status_code != 200:
            raise HTTPException(status_code=asr_response.status_code, detail="Error transcribing audio")
        asr_data = asr_response.json()
        transcription = None
        if isinstance(asr_data, dict) and "transcription" in asr_data:
            transcription = asr_data["transcription"]
        elif isinstance(asr_data, list) and len(asr_data) > 0:
            if isinstance(asr_data[0], dict) and "transcription" in asr_data[0]:
                transcription = asr_data[0]["transcription"]
            else:
                transcription = str(asr_data[0])
        else:
            transcription = str(asr_data)
        
        if not transcription:
            raise HTTPException(status_code=400, detail="No valid transcription returned from ASR service")
        
        logger.info(f"Extracted transcription: {transcription}")
        
        if not transcription:
            raise HTTPException(status_code=400, detail="No transcription returned from ASR service")
        alignment_response = requests.post(
            ALIGNMENT_SERVICE_URL,
            files={"file": audio_content},
            data={"text": transcription,"reftext":text}
            
        )

        if alignment_response.status_code != 200:
            raise HTTPException(status_code=alignment_response.status_code, detail="Error aligning phonemes")

        alignment_data = alignment_response.json()
        scoring_response = requests.post(
            SCORING_SERVICE_URL,
            json=alignment_data
        )

        if scoring_response.status_code != 200:
            raise HTTPException(status_code=scoring_response.status_code, detail="Error scoring pronunciation")

        score_data = scoring_response.json()

        return {
            "transcription": transcription,
            "phoneme_alignment": alignment_data,
            "pronunciation_score": score_data
        }
    
    except Exception as e:
        logger.error(f"Error during analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/transcribe")
async def transcribe(audio_file: UploadFile = File(...)):
    """
    音频转录接口
    接收音频文件，返回语音识别结果
    """
    try:
        if not audio_file:
            raise HTTPException(status_code=422, detail="Missing audio file")
        
        # 验证文件类型
        if not audio_file.content_type or not audio_file.content_type.startswith('audio/'):
            raise HTTPException(status_code=422, detail="Invalid audio file format")
        
        logger.info(f"Processing audio file: {audio_file.filename}")
        
        # 读取音频文件内容
        audio_content = await audio_file.read()
        
        if len(audio_content) == 0:
            raise HTTPException(status_code=422, detail="Empty audio file")
        
        # 调用ASR服务进行转录
        asr_response = requests.post(
            ASR_SERVICE_URL, 
            files={"file": ("audio.wav", audio_content, audio_file.content_type)},
            data={"text": ""}  # 空文本，表示纯转录模式
        )
        
        if asr_response.status_code != 200:
            logger.error(f"ASR service error: {asr_response.status_code} - {asr_response.text}")
            raise HTTPException(
                status_code=asr_response.status_code, 
                detail=f"Error transcribing audio: {asr_response.text}"
            )
        
        asr_data = asr_response.json()
        
        # 提取转录结果
        transcription = None
        if isinstance(asr_data, dict) and "transcription" in asr_data:
            transcription = asr_data["transcription"]
        elif isinstance(asr_data, list) and len(asr_data) > 0:
            if isinstance(asr_data[0], dict) and "transcription" in asr_data[0]:
                transcription = asr_data[0]["transcription"]
            else:
                transcription = str(asr_data[0])
        else:
            transcription = str(asr_data)
        
        if not transcription:
            raise HTTPException(status_code=400, detail="No valid transcription returned from ASR service")
        
        logger.info(f"Transcription result: {transcription}")
        
        return {
            "transcription": transcription,
            "confidence": asr_data.get("confidence", None) if isinstance(asr_data, dict) else None,
            "language": asr_data.get("language", "en") if isinstance(asr_data, dict) else "en",
            "processing_time": asr_data.get("processing_time", None) if isinstance(asr_data, dict) else None
        }
        
    except HTTPException:
        # 重新抛出 HTTP 异常
        raise
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error when calling ASR service: {e}")
        raise HTTPException(status_code=503, detail="ASR service unavailable")
    except Exception as e:
        logger.error(f"Error during transcription: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")