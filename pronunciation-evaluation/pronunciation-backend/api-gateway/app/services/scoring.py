import httpx

class ScoringService:
    async def score(self, alignment_data):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8003/score",
                json=alignment_data,
                timeout=30.0
            )
            return response.json()