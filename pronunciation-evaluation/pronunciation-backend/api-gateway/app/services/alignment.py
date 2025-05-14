import httpx

class AlignmentService:
    async def align(self, audio_path, text, transcription):
        async with httpx.AsyncClient() as client:
            with open(audio_path, "rb") as audio_file:
                response = await client.post(
                    "http://localhost:8002/align",
                    files={"file": audio_file},
                    data={"text": text, "transcription": transcription},
                    timeout=30.0
                )
                return response.json()