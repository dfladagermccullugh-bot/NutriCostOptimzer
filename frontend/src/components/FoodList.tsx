import { useState } from "react";
import type { FoodItem } from "../types";

interface Props {
  foods: FoodItem[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Pick<FoodItem, "weight_g" | "price_usd">>) => void;
}

export default function FoodList({ foods, onRemove, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editPrice, setEditPrice] = useState("");

  function startEdit(food: FoodItem) {
    setEditingId(food.id);
    setEditWeight(String(food.weight_g));
    setEditPrice(String(food.price_usd));
  }

  function saveEdit(id: string) {
    const w = parseFloat(editWeight);
    const p = parseFloat(editPrice);
    if (w > 0 && p > 0) {
      onUpdate(id, { weight_g: w, price_usd: p });
    }
    setEditingId(null);
  }

  if (foods.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-400 text-sm">
        No foods added yet. Add foods above to get started.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          Foods <span className="text-sm font-normal text-gray-500">({foods.length})</span>
        </h2>
      </div>
      <div className="divide-y divide-gray-100">
        {foods.map((food) => (
          <div key={food.id} className="px-4 py-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">{food.name}</div>
                {editingId === food.id ? (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="number"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      className="w-24 rounded border border-gray-300 px-2 py-1 text-xs"
                      placeholder="grams"
                    />
                    <span className="text-xs text-gray-400 self-center">g</span>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-20 rounded border border-gray-300 px-2 py-1 text-xs"
                      placeholder="price"
                    />
                    <button onClick={() => saveEdit(food.id)} className="text-xs text-blue-600 hover:text-blue-800">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-gray-400">Cancel</button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 mt-0.5 space-x-2">
                    <span
                      className="cursor-pointer hover:text-blue-600"
                      onClick={() => startEdit(food)}
                    >
                      {food.weight_g}g · ${food.price_usd.toFixed(2)}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>{food.nutrition.calories} cal · {food.nutrition.protein_g}g P · {food.nutrition.carbs_g}g C · {food.nutrition.fat_g}g F /100g</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-400">{food.source === "local_db" ? "USDA" : food.source === "usda_api" ? "USDA API" : "Manual"}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => onRemove(food.id)}
                className="ml-2 text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
                title="Remove"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
