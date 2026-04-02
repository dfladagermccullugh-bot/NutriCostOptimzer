from backend.db.database import get_db


def search_foods(query: str, limit: int = 10) -> list[dict]:
    """Search the local USDA database for foods matching the query."""
    with get_db() as conn:
        # Use case-insensitive LIKE with ranking by best match
        words = query.strip().split()
        if not words:
            return []

        # Build a query that ranks results: exact match first, then starts-with, then contains
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
