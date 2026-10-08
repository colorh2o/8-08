import os

import httpx
from fastapi import FastAPI, HTTPException

app = FastAPI()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/cards")
async def get_cards():
    supabase_url = os.getenv("SUPABASE_URL")
    publishable_key = os.getenv("SUPABASE_PUBLISHABLE_KEY") or os.getenv(
        "SUPABASE_PUBLISABLE_KEY"
    )
    if not supabase_url or not publishable_key:
        raise HTTPException(status_code=503, detail="Supabase configuration is missing")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{supabase_url.rstrip('/')}/rest/v1/cards",
                params={"select": "*"},
                headers={
                    "apikey": publishable_key,
                    "Authorization": f"Bearer {publishable_key}",
                },
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as error:
        raise HTTPException(status_code=502, detail="Supabase rejected the cards request") from error
    except httpx.RequestError as error:
        raise HTTPException(status_code=502, detail="Could not reach Supabase") from error

    return response.json()