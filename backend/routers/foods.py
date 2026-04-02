from fastapi import APIRouter, Query
from backend.services.food_search import search_foods

router = APIRouter()


@router.get("/api/foods/search")
def search(q: str = Query(..., min_length=1), limit: int = Query(10, ge=1, le=50)):
    results = search_foods(q, limit)
    return {
        "results": results,
        "query": q,
        "total": len(results),
    }
