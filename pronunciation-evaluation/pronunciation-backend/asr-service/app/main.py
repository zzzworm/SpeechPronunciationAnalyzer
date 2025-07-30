from fastapi import FastAPI, UploadFile, File, Form, HTTPException
import os
import logging
from typing import Optional

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ASR Service", description="Automatic Speech Recognition Service")

# 延迟加载模型，避免启动时错误
asr_model = None

def get_asr_model():
    """
    获取ASR模型实例（延迟加载）
    """
    global asr_model
    if asr_model is None:
        try:
            from app.models.whisper_asr import WhisperASR
            logger.info("Initializing ASR model...")
            asr_model = WhisperASR()
            logger.info("ASR model initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize ASR model: {e}")
            raise HTTPException(status_code=503, detail=f"ASR service unavailable: {str(e)}")
    return asr_model

@app.get("/health")
async def health_check():
    """健康检查接口"""
    try:
        # 尝试获取模型状态
        model = get_asr_model()
        return {
            "status": "healthy", 
            "service": "asr-service",
            "model_loaded": model is not None,
            "device": getattr(model, 'device', 'unknown')
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "asr-service", 
            "error": str(e)
        }

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...), text: Optional[str] = Form(None)):
    """
    音频转录接口
    
    Args:
        file: 音频文件
        text: 可选的参考文本，如果提供则返回该文本，否则返回转录结果
    
    Returns:
        转录结果或参考文本
    """
    if not file:
        raise HTTPException(status_code=400, detail="No audio file provided")
    
    # 验证文件类型
    if not file.content_type or not file.content_type.startswith('audio/'):
        logger.warning(f"Invalid file type: {file.content_type}")
    
    temp_path = f"temp_{file.filename}"
    
    try:
        # 保存临时文件
        with open(temp_path, "wb") as f:
            content = await file.read()
            if len(content) == 0:
                raise HTTPException(status_code=400, detail="Empty audio file")
            f.write(content)
        
        # 如果提供了参考文本且不为空，则返回参考文本
        if text and text.strip():
            logger.info(f"Using provided reference text: {text.strip()}")
            return {
                "transcription": text.strip(),
                "source": "reference_text",
                "language": "unknown",
                "confidence": 1.0,
                "message": "Using provided reference text"
            }
        else:
            # 获取ASR模型
            model = get_asr_model()
            
            # 进行语音识别
            logger.info(f"Transcribing audio file: {file.filename}")
            result = model.transcribe(temp_path)
            
            logger.info(f"Transcription result: {result.get('transcription', 'No transcription')}")
            
            # 检查是否有错误
            if "error" in result:
                raise HTTPException(status_code=500, detail=f"Transcription error: {result['error']}")
            
            # 确保返回格式一致
            if isinstance(result, dict):
                return {
                    "transcription": result.get("transcription", ""),
                    "source": "asr_model",
                    "language": result.get("language", "unknown"),
                    "confidence": result.get("confidence", 0.0),
                    "segments": result.get("segments", []),
                    "processing_info": result.get("processing_info", {})
                }
            else:
                return {
                    "transcription": str(result),
                    "source": "asr_model",
                    "language": "unknown",
                    "confidence": 0.0
                }
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing audio file {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        # 清理临时文件
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                logger.debug(f"Cleaned up temporary file: {temp_path}")
            except Exception as e:
                logger.warning(f"Failed to remove temporary file {temp_path}: {e}")