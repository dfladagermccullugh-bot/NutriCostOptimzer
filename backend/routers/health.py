import os
from fastapi import APIRouter
from backend.db.database import get_db

router = APIRouter()


@router.get("/api/health")
def health_check():
    ai_configured = bool(os.environ.get("AI_API_KEY")) and bool(os.environ.get("AI_API_URL"))
    usda_configured = bool(os.environ.get("USDA_API_KEY"))

    with get_db() as conn:
        count = conn.execute("SELECT COUNT(*) FROM foods").fetchone()[0]

    return {
        "status": "ok",
        "ai_configured": ai_configured,
        "usda_api_configured": usda_configured,
        "local_foods_count": count,
    }
