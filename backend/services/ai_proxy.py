import os
import httpx
from backend.services.nutrition import extract_json_object
from backend.services.security import validate_ai_endpoint

SYSTEM_PROMPT = """You are a food input parser. Extract the following from the user's input:
- name: the food item name (lowercase, no quantities)
- weight: the numeric weight value
- weight_unit: one of "g", "kg", "oz", "lb", "unit"
- price: the numeric price in USD

Respond ONLY with a JSON object. Examples:
Input: "chicken breast 3lbs 15 dollars"
Output: {"name": "chicken breast", "weight": 3, "weight_unit": "lb", "price": 15.00}

Input: "2 dozen eggs 4.99"
Output: {"name": "eggs", "weight": 24, "weight_unit": "unit", "price": 4.99}

If you cannot parse the input, respond with: {"error": "unparseable"}"""


async def parse_food_input(
    text: str,
    endpoint: str | None = None,
    api_key: str | None = None,
    model: str | None = None,
) -> dict:
    """Send natural language food input to an OpenAI-compatible API for parsing."""
    endpoint = endpoint or os.environ.get("AI_API_URL", "")
    api_key = api_key or os.environ.get("AI_API_KEY", "")
    model = model or os.environ.get("AI_MODEL", "gpt-4o-mini")

    if not endpoint or not api_key:
        return {"error": "AI API not configured. Please use manual input or configure AI settings."}

    endpoint_error = validate_ai_endpoint(endpoint)
    if endpoint_error:
        return {"error": endpoint_error}

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
        "temperature": 0,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.post(endpoint, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            # Robust to models that wrap JSON in code fences or add prose (audit M1).
            return extract_json_object(content)
        except httpx.HTTPStatusError as e:
            return {"error": f"AI API error: {e.response.status_code}"}
        except ValueError:
            return {"error": "Couldn't read the AI response. Try rephrasing or use manual entry."}
        except (httpx.RequestError, Exception) as e:
            return {"error": f"AI service unavailable: {str(e)}"}
