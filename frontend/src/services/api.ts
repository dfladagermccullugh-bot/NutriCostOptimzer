import type { FoodSearchResult } from "../types";

interface SearchResponse {
  results: FoodSearchResult[];
  query: string;
  total: number;
}

interface ParseResponse {
  name?: string;
  weight_g?: number;
  price_usd?: number;
  original_input?: string;
  error?: string;
  details?: string;
}

interface HealthResponse {
  status: string;
  ai_configured: boolean;
  usda_api_configured: boolean;
  local_foods_count: number;
}

export async function searchFoods(query: string, limit = 10): Promise<SearchResponse> {
  const resp = await fetch(`/api/foods/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  if (!resp.ok) throw new Error("Search failed");
  return resp.json();
}

export async function parseFood(
  input: string,
  aiConfig?: { endpoint: string; model: string; key: string }
): Promise<ParseResponse> {
  const body: Record<string, unknown> = { input };
  if (aiConfig?.key) body.ai_config = aiConfig;

  const resp = await fetch("/api/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error("Parse failed");
  return resp.json();
}

export async function checkHealth(): Promise<HealthResponse> {
  const resp = await fetch("/api/health");
  if (!resp.ok) throw new Error("Health check failed");
  return resp.json();
}
