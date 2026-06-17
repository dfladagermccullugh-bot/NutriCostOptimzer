"""Pure, dependency-free helpers for parsing external data (USDA + AI responses).

Kept free of httpx/fastapi imports so they can be unit-tested in isolation.
"""
import json
import re

# USDA data types that report nutrients on a per-100g basis. Branded foods report per-serving
# label nutrients and are excluded (audit C2) to avoid mixing bases.
USDA_PER_100G_TYPES = ("Foundation", "SR Legacy")


def _num(v) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def _find_nutrient(nutrients, name: str) -> float:
    for n in nutrients:
        if (n.get("nutrientName") or "") == name:
            return _num(n.get("value"))
    return 0.0


def _find_energy_kcal(nutrients) -> float:
    """Return Energy in kcal only — never kilojoules (audit C2).

    USDA frequently lists Energy twice (kcal and kJ); taking the wrong one inflates calories ~4.18x.
    """
    for n in nutrients:
        name = (n.get("nutrientName") or "").lower()
        unit = (n.get("unitName") or "").lower()
        if "energy" in name and unit == "kcal":
            return _num(n.get("value"))
    return 0.0


def extract_macros_from_usda(food: dict) -> dict | None:
    """Extract per-100g macros from a USDA FoodData Central search item.

    Returns None when the item is unusable (no calories and no protein).
    """
    nutrients = food.get("foodNutrients", []) or []
    cal = _find_energy_kcal(nutrients)
    pro = _find_nutrient(nutrients, "Protein")
    carb = _find_nutrient(nutrients, "Carbohydrate, by difference")
    fat = _find_nutrient(nutrients, "Total lipid (fat)")
    if not cal and not pro:
        return None
    return {"calories": cal, "protein_g": pro, "carbs_g": carb, "fat_g": fat}


def extract_json_object(content: str) -> dict:
    """Parse a JSON object from an LLM response that may wrap it in code fences or prose (audit M1)."""
    if not content:
        raise ValueError("empty AI response")
    text = content.strip()

    # Strip a ```json ... ``` or ``` ... ``` fence if present.
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Fall back to the first {...} blob in the text.
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise
