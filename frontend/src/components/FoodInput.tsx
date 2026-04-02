import { useState } from "react";
import type { FoodItem, FoodSearchResult, NutritionPer100g } from "../types";
import { useFoodSearch } from "../hooks/useFoodSearch";
import { parseFood, searchFoods } from "../services/api";

interface Props {
  onAddFood: (food: FoodItem) => void;
  aiEnabled: boolean;
  aiConfig?: { endpoint: string; model: string; key: string };
}

type InputMode = "natural" | "structured";

interface ParsedPreview {
  name: string;
  weight_g: number;
  price_usd: number;
  original_input: string;
}

export default function FoodInput({ onAddFood, aiEnabled, aiConfig }: Props) {
  const [mode, setMode] = useState<InputMode>(aiEnabled ? "natural" : "structured");

  // Natural language state
  const [nlInput, setNlInput] = useState("");
  const [nlParsing, setNlParsing] = useState(false);
  const [nlError, setNlError] = useState("");
  const [parsedPreview, setParsedPreview] = useState<ParsedPreview | null>(null);
  const [previewFood, setPreviewFood] = useState<FoodSearchResult | null>(null);
  const [previewSearching, setPreviewSearching] = useState(false);

  // Structured input state
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("lb");
  const [price, setPrice] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [showManualNutrition, setShowManualNutrition] = useState(false);
  const [manualNutrition, setManualNutrition] = useState<NutritionPer100g>({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [showResults, setShowResults] = useState(false);

  const { results, loading } = useFoodSearch(mode === "structured" ? name : "");

  const unitMultipliers: Record<string, number> = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };

  // --- Natural Language Handlers ---

  async function handleNlParse() {
    if (!nlInput.trim()) return;
    setNlParsing(true);
    setNlError("");
    setParsedPreview(null);
    setPreviewFood(null);

    try {
      const result = await parseFood(nlInput, aiConfig);
      if (result.error) {
        setNlError(result.error);
        setNlParsing(false);
        return;
      }

      const preview: ParsedPreview = {
        name: result.name || "",
        weight_g: result.weight_g || 0,
        price_usd: result.price_usd || 0,
        original_input: result.original_input || nlInput,
      };
      setParsedPreview(preview);

      // Search USDA for nutrition data
      setPreviewSearching(true);
      const searchResult = await searchFoods(preview.name);
      if (searchResult.results.length > 0) {
        setPreviewFood(searchResult.results[0]);
      }
      setPreviewSearching(false);
    } catch {
      setNlError("Failed to parse input. Try rephrasing or switch to manual entry.");
    } finally {
      setNlParsing(false);
    }
  }

  function handleNlAdd() {
    if (!parsedPreview || !previewFood) return;

    const food: FoodItem = {
      id: crypto.randomUUID(),
      name: previewFood.description,
      weight_g: parsedPreview.weight_g,
      price_usd: parsedPreview.price_usd,
      nutrition: previewFood.per_100g,
      source: previewFood.source as "local_db" | "usda_api",
      fdc_id: previewFood.fdc_id,
    };

    onAddFood(food);
    setNlInput("");
    setParsedPreview(null);
    setPreviewFood(null);
    setNlError("");
  }

  function handleNlDiscard() {
    setParsedPreview(null);
    setPreviewFood(null);
    setNlError("");
  }

  // --- Structured Input Handlers ---

  function handleSelectFood(food: FoodSearchResult) {
    setSelectedFood(food);
    setName(food.description);
    setShowResults(false);
    setShowManualNutrition(false);
  }

  function handleStructuredAdd() {
    const w = parseFloat(weight);
    const p = parseFloat(price);
    if (!w || !p) return;

    const weightG = w * (unitMultipliers[unit] || 1);
    const nutrition = selectedFood ? selectedFood.per_100g : manualNutrition;

    if (!nutrition.calories && !nutrition.protein_g && !nutrition.carbs_g && !nutrition.fat_g) return;

    const food: FoodItem = {
      id: crypto.randomUUID(),
      name: selectedFood?.description || name,
      weight_g: Math.round(weightG * 100) / 100,
      price_usd: p,
      nutrition,
      source: selectedFood ? (selectedFood.source as "local_db" | "usda_api") : "manual",
      fdc_id: selectedFood?.fdc_id,
    };

    onAddFood(food);
    setName("");
    setWeight("");
    setPrice("");
    setSelectedFood(null);
    setShowManualNutrition(false);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Add Food</h2>
        {aiEnabled && (
          <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setMode("natural")}
              className={`px-2.5 py-1 rounded-md transition-colors ${mode === "natural" ? "bg-white shadow-sm text-gray-900 font-medium" : "text-gray-500"}`}
            >
              AI
            </button>
            <button
              onClick={() => setMode("structured")}
              className={`px-2.5 py-1 rounded-md transition-colors ${mode === "structured" ? "bg-white shadow-sm text-gray-900 font-medium" : "text-gray-500"}`}
            >
              Manual
            </button>
          </div>
        )}
      </div>

      {/* Natural Language Mode */}
      {mode === "natural" && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Describe your food item</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNlParse()}
                placeholder='e.g. "chicken breast 3lbs 15 dollars"'
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={handleNlParse}
                disabled={nlParsing || !nlInput.trim()}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {nlParsing ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Parsing
                  </span>
                ) : "Parse"}
              </button>
            </div>
          </div>

          {nlError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {nlError}
            </div>
          )}

          {parsedPreview && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{parsedPreview.name}</span>
                <span className="text-xs text-gray-400">parsed from: "{parsedPreview.original_input}"</span>
              </div>
              <div className="text-sm text-gray-600">
                {parsedPreview.weight_g}g &middot; ${parsedPreview.price_usd.toFixed(2)}
              </div>

              {previewSearching && (
                <div className="text-xs text-gray-400">Looking up nutrition data...</div>
              )}

              {previewFood && (
                <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-800">
                  USDA: {previewFood.per_100g.calories} cal &middot; {previewFood.per_100g.protein_g}g P &middot; {previewFood.per_100g.carbs_g}g C &middot; {previewFood.per_100g.fat_g}g F per 100g
                </div>
              )}

              {!previewSearching && !previewFood && (
                <div className="text-xs text-amber-600">No USDA nutrition data found for "{parsedPreview.name}".</div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleNlAdd}
                  disabled={!previewFood}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={handleNlDiscard}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Structured Input Mode */}
      {mode === "structured" && (
        <div className="space-y-3">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Food Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setShowResults(true); setSelectedFood(null); }}
              onFocus={() => setShowResults(true)}
              placeholder="e.g. chicken breast"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus={!aiEnabled}
            />
            {loading && <div className="absolute right-3 top-8 text-xs text-gray-400">Searching...</div>}

            {showResults && results.length > 0 && !selectedFood && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {results.map((r) => (
                  <button
                    key={r.fdc_id}
                    onClick={() => handleSelectFood(r)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0"
                  >
                    <div className="font-medium text-gray-900">{r.description}</div>
                    <div className="text-xs text-gray-500">
                      {r.per_100g.calories} cal &middot; {r.per_100g.protein_g}g P &middot; {r.per_100g.carbs_g}g C &middot; {r.per_100g.fat_g}g F per 100g
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showResults && results.length === 0 && name.length >= 2 && !loading && !selectedFood && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                <p className="text-sm text-gray-500">No results found.</p>
                {!showManualNutrition && (
                  <button
                    onClick={() => { setShowManualNutrition(true); setShowResults(false); }}
                    className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Enter nutrition manually
                  </button>
                )}
              </div>
            )}
          </div>

          {selectedFood && (
            <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-800">
              USDA: {selectedFood.per_100g.calories} cal &middot; {selectedFood.per_100g.protein_g}g P &middot; {selectedFood.per_100g.carbs_g}g C &middot; {selectedFood.per_100g.fat_g}g F per 100g
            </div>
          )}

          {showManualNutrition && (
            <div className="bg-amber-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-amber-800">Enter nutrition per 100g:</p>
              <div className="grid grid-cols-2 gap-2">
                {(["calories", "protein_g", "carbs_g", "fat_g"] as const).map((key) => (
                  <div key={key}>
                    <label className="text-xs text-gray-600">{key === "calories" ? "Calories (kcal)" : key.replace("_g", " (g)")}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={manualNutrition[key] || ""}
                      onChange={(e) => setManualNutrition({ ...manualNutrition, [key]: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="3"
                  className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-2 text-sm bg-white"
                >
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="15.00"
                  className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleStructuredAdd}
            disabled={(!selectedFood && !showManualNutrition) || !weight || !price}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add Food
          </button>
        </div>
      )}
    </div>
  );
}
