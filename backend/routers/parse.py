from fastapi import APIRouter
from pydantic import BaseModel
from backend.services.ai_proxy import parse_food_input
from backend.services.unit_conversion import convert_to_grams

router = APIRouter()


class AIConfig(BaseModel):
    endpoint: str | None = None
    model: str | None = None
    key: str | None = None


class ParseRequest(BaseModel):
    input: str
    ai_config: AIConfig | None = None


@router.post("/api/parse")
async def parse(req: ParseRequest):
    config = req.ai_config or AIConfig()
    result = parse_food_input(
        req.input,
        endpoint=config.endpoint,
        api_key=config.key,
        model=config.model,
    )
    parsed = await result

    if "error" in parsed:
        return {"error": parsed["error"], "details": parsed.get("details", "")}

    # Convert weight to grams
    weight = parsed.get("weight", 0)
    unit = parsed.get("weight_unit", "g")
    name = parsed.get("name", "")

    weight_g = convert_to_grams(weight, unit, name)
    if weight_g is None:
        return {
            "error": f"Cannot convert '{unit}' to grams for '{name}'. Please specify weight in g, kg, oz, or lb.",
        }

    return {
        "name": name,
        "weight_g": round(weight_g, 2),
        "price_usd": parsed.get("price", 0),
        "original_input": req.input,
    }
