import { useState } from "react";
import type { FoodItem, FoodSearchResult, NutritionPer100g } from "../types";
import { useFoodSearch } from "../hooks/useFoodSearch";

interface Props {
  onAddFood: (food: FoodItem) => void;
  aiEnabled: boolean;
}

type InputMode = "structured";

export default function FoodInput({ onAddFood }: Props) {
  const [mode] = useState<InputMode>("structured");
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("lb");
  const [price, setPrice] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [showManualNutrition, setShowManualNutrition] = useState(false);
  const [manualNutrition, setManualNutrition] = useState<NutritionPer100g>({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [showResults, setShowResults] = useState(false);

  const { results, loading } = useFoodSearch(name);

  const unitMultipliers: Record<string, number> = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };

  function handleSelectFood(food: FoodSearchResult) {
    setSelectedFood(food);
    setName(food.description);
    setShowResults(false);
    setShowManualNutrition(false);
  }

  function handleAdd() {
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
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Add Food</h2>

      {mode === "structured" && (
        <div className="space-y-3">
          {/* Food name with USDA search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Food Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setShowResults(true); setSelectedFood(null); }}
              onFocus={() => setShowResults(true)}
              placeholder="e.g. chicken breast"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      {r.per_100g.calories} cal · {r.per_100g.protein_g}g P · {r.per_100g.carbs_g}g C · {r.per_100g.fat_g}g F per 100g
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
              USDA: {selectedFood.per_100g.calories} cal · {selectedFood.per_100g.protein_g}g P · {selectedFood.per_100g.carbs_g}g C · {selectedFood.per_100g.fat_g}g F per 100g
            </div>
          )}

          {/* Manual nutrition entry */}
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

          {/* Weight and Price */}
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
            onClick={handleAdd}
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
