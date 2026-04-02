import os
import httpx
from backend.db.database import get_db


def search_foods(query: str, limit: int = 10) -> list[dict]:
    """Search the local USDA database for foods matching the query.
    Falls back to USDA FoodData Central API if no local results found.
    """
    results = _search_local(query, limit)
    if results:
        return results

    # Fallback to USDA API
    usda_key = os.environ.get("USDA_API_KEY", "")
    if not usda_key:
        return []

    return _search_usda_api(query, usda_key, limit)


def _search_local(query: str, limit: int) -> list[dict]:
    with get_db() as conn:
        if not query.strip():
            return []

        sql = """
            SELECT fdc_id, description, category,
                   calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
                   source,
                   CASE
                       WHEN LOWER(description) = LOWER(?) THEN 0
                       WHEN LOWER(description) LIKE LOWER(? || '%') THEN 1
                       ELSE 2
                   END AS rank
            FROM foods
            WHERE LOWER(description) LIKE LOWER(?)
            ORDER BY rank, LENGTH(description)
            LIMIT ?
        """
        pattern = f"%{query}%"
        rows = conn.execute(sql, (query, query, pattern, limit)).fetchall()

        return [
            {
                "fdc_id": row["fdc_id"],
                "description": row["description"],
                "category": row["category"],
                "per_100g": {
                    "calories": row["calories_per_100g"],
                    "protein_g": row["protein_per_100g"],
                    "carbs_g": row["carbs_per_100g"],
                    "fat_g": row["fat_per_100g"],
                },
                "source": "local_db" if row["source"] == "local" else "usda_api",
            }
            for row in rows
        ]


def _search_usda_api(query: str, api_key: str, limit: int) -> list[dict]:
    """Query USDA FoodData Central API and cache results locally."""
    try:
        resp = httpx.get(
            "https://api.nal.usda.gov/fdc/v1/foods/search",
            params={"query": query, "pageSize": limit, "api_key": api_key},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        return []

    results = []
    for item in data.get("foods", [])[:limit]:
        nutrients = {n["nutrientName"]: n.get("value", 0) for n in item.get("foodNutrients", [])}
        cal = nutrients.get("Energy", 0)
        pro = nutrients.get("Protein", 0)
        carb = nutrients.get("Carbohydrate, by difference", 0)
        fat = nutrients.get("Total lipid (fat)", 0)

        if not cal and not pro:
            continue

        fdc_id = item.get("fdcId", 0)
        desc = item.get("description", "Unknown")
        category = item.get("foodCategory", None)

        # Cache into local DB
        _cache_food(fdc_id, desc, category, cal, pro, carb, fat)

        results.append({
            "fdc_id": fdc_id,
            "description": desc,
            "category": category,
            "per_100g": {
                "calories": cal,
                "protein_g": pro,
                "carbs_g": carb,
                "fat_g": fat,
            },
            "source": "usda_api",
        })

    return results


def _cache_food(fdc_id: int, desc: str, category: str | None, cal: float, pro: float, carb: float, fat: float):
    """Cache a USDA API result into the local database."""
    try:
        with get_db() as conn:
            conn.execute(
                "INSERT OR IGNORE INTO foods (fdc_id, description, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, source) VALUES (?, ?, ?, ?, ?, ?, ?, 'api')",
                (fdc_id, desc, category, cal, pro, carb, fat),
            )
            conn.commit()
    except Exception:
        pass
