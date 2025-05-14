import torch
import torchaudio
from transformers import WhisperProcessor, WhisperForConditionalGeneration

class WhisperASR:
    def __init__(self, model_size="small"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.processor = WhisperProcessor.from_pretrained(f"openai/whisper-{model_size}")
        self.model = WhisperForConditionalGeneration.from_pretrained(f"openai/whisper-{model_size}").to(self.device)
    
    def transcribe(self, audio_path):
        waveform, sample_rate = torchaudio.load(audio_path)
        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(sample_rate, 16000)
            waveform = resampler(waveform)
        
        inputs = self.processor(
            waveform.squeeze().numpy(), 
            sampling_rate=16000, 
            return_tensors="pt"
        ).input_features.to(self.device)
        
        predicted_ids = self.model.generate(inputs)
        transcription = self.processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]
        
        return {"transcription": transcription}