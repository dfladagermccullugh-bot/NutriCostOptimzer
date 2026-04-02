import json
import os

CONVERSION_TABLE = {
    "g": 1,
    "kg": 1000,
    "oz": 28.3495,
    "lb": 453.592,
    "lbs": 453.592,
}

_unit_weights_path = os.path.join(os.path.dirname(__file__), "..", "db", "unit_weights.json")
with open(_unit_weights_path) as f:
    UNIT_WEIGHTS = json.load(f)


def convert_to_grams(weight: float, unit: str, food_name: str | None = None) -> float | None:
    """Convert a weight value to grams.

    Returns None if unit is 'unit' and food_name is not in the unit weights table.
    """
    unit = unit.lower().strip()
    if unit in CONVERSION_TABLE:
        return weight * CONVERSION_TABLE[unit]
    if unit == "unit" and food_name:
        name_lower = food_name.lower().strip()
        if name_lower in UNIT_WEIGHTS:
            return weight * UNIT_WEIGHTS[name_lower]
    return None
