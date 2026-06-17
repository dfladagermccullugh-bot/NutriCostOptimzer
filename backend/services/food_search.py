import os
import sqlite3
import httpx
from backend.db.database import get_db
from backend.services.nutrition import extract_macros_from_usda, USDA_PER_100G_TYPES


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
            params={
                "query": query,
                "pageSize": limit,
                # Only per-100g datasets — exclude Branded foods whose nutrients are per-serving (audit C2).
                "dataType": ",".join(USDA_PER_100G_TYPES),
                "api_key": api_key,
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except (httpx.HTTPError, ValueError):
        # Network/HTTP failure or malformed JSON — degrade to no results (audit M5).
        return []

    results = []
    cache_rows = []
    for item in data.get("foods", [])[:limit]:
        macros = extract_macros_from_usda(item)
        if macros is None:
            continue

        fdc_id = item.get("fdcId", 0)
        desc = item.get("description", "Unknown")
        category = item.get("foodCategory", None)

        cache_rows.append((fdc_id, desc, category, macros["calories"], macros["protein_g"], macros["carbs_g"], macros["fat_g"]))
        results.append({
            "fdc_id": fdc_id,
            "description": desc,
            "category": category,
            "per_100g": macros,
            "source": "usda_api",
        })

    _cache_foods(cache_rows)  # single batched write (audit M4)
    return results


def _cache_foods(rows: list[tuple]):
    """Cache USDA API results into the local DB in a single batched write (audit M4)."""
    if not rows:
        return
    try:
        with get_db() as conn:
            conn.executemany(
                "INSERT OR IGNORE INTO foods (fdc_id, description, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, source) VALUES (?, ?, ?, ?, ?, ?, ?, 'api')",
                rows,
            )
            conn.commit()
    except sqlite3.Error:
        pass
