import httpx

class ASRService:
    async def transcribe(self, audio_path):
        async with httpx.AsyncClient() as client:
            with open(audio_path, "rb") as audio_file:
                response = await client.post(
                    "http://localhost:8001/transcribe",
                    files={"file": audio_file},
                    timeout=30.0
                )
                return response.json()