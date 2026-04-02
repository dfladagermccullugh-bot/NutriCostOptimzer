import { useState, useRef } from "react";
import type { FoodItem } from "../types";

interface Props {
  foods: FoodItem[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Pick<FoodItem, "weight_g" | "price_usd">>) => void;
}

function FoodRow({ food, onRemove, onUpdate }: { food: FoodItem; onRemove: () => void; onUpdate: (updates: Partial<Pick<FoodItem, "weight_g" | "price_usd">>) => void }) {
  const [editing, setEditing] = useState(false);
  const [editWeight, setEditWeight] = useState("");
  const [editPrice, setEditPrice] = useState("");

  // Swipe state
  const touchStartX = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);

  function startEdit() {
    setEditing(true);
    setEditWeight(String(food.weight_g));
    setEditPrice(String(food.price_usd));
  }

  function saveEdit() {
    const w = parseFloat(editWeight);
    const p = parseFloat(editPrice);
    if (w > 0 && p > 0) onUpdate({ weight_g: w, price_usd: p });
    setEditing(false);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    setSwiping(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!swiping) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    if (diff < 0) setSwipeOffset(Math.max(diff, -100));
  }

  function handleTouchEnd() {
    setSwiping(false);
    if (swipeOffset < -70) {
      onRemove();
    } else {
      setSwipeOffset(0);
    }
  }

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Delete indicator behind */}
      {swipeOffset < 0 && (
        <div className="absolute inset-y-0 right-0 flex items-center justify-end px-4 bg-red-500 text-white text-sm font-medium"
             style={{ width: Math.abs(swipeOffset) }}>
          Delete
        </div>
      )}

      <div
        className="px-4 py-3 bg-white transition-transform"
        style={{ transform: `translateX(${swipeOffset}px)`, transition: swiping ? "none" : "transform 0.2s" }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 text-sm truncate">{food.name}</div>
            {editing ? (
              <div className="flex gap-2 mt-1">
                <input type="number" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} className="w-24 rounded border border-gray-300 px-2 py-1 text-xs" placeholder="grams" />
                <span className="text-xs text-gray-400 self-center">g</span>
                <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-20 rounded border border-gray-300 px-2 py-1 text-xs" placeholder="price" />
                <button onClick={saveEdit} className="text-xs text-blue-600 hover:text-blue-800">Save</button>
                <button onClick={() => setEditing(false)} className="text-xs text-gray-400">Cancel</button>
              </div>
            ) : (
              <div className="text-xs text-gray-500 mt-0.5 space-x-2">
                <span className="cursor-pointer hover:text-blue-600" onClick={startEdit}>
                  {food.weight_g}g &middot; ${food.price_usd.toFixed(2)}
                </span>
                <span className="text-gray-300">|</span>
                <span>{food.nutrition.calories} cal &middot; {food.nutrition.protein_g}g P &middot; {food.nutrition.carbs_g}g C &middot; {food.nutrition.fat_g}g F /100g</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-400">{food.source === "local_db" ? "USDA" : food.source === "usda_api" ? "USDA API" : "Manual"}</span>
              </div>
            )}
          </div>
          <button
            onClick={onRemove}
            className="ml-2 text-gray-300 hover:text-red-500 transition-colors text-lg leading-none hidden sm:block"
            title="Remove"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FoodList({ foods, onRemove, onUpdate }: Props) {
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
          <FoodRow
            key={food.id}
            food={food}
            onRemove={() => onRemove(food.id)}
            onUpdate={(updates) => onUpdate(food.id, updates)}
          />
        ))}
      </div>
      <div className="px-4 py-2 text-xs text-gray-400 sm:hidden">
        Swipe left to delete
      </div>
    </div>
  );
}
