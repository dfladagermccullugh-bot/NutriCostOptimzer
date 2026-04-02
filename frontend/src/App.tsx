import { useState, useRef, useCallback } from "react";
import type { FoodItem, GoalConfig as GoalConfigType, OptimizationResult, InfeasibilityDiagnostic } from "./types";
import { usePreferences } from "./hooks/usePreferences";
import { optimize, diagnoseInfeasibility } from "./services/optimizer";
import { MIN_FOODS_TO_OPTIMIZE } from "./constants";
import FoodInput from "./components/FoodInput";
import FoodList from "./components/FoodList";
import GoalConfig from "./components/GoalConfig";
import ResultsDashboard from "./components/ResultsDashboard";
import InfeasibilityPanel from "./components/InfeasibilityPanel";
import SettingsPanel from "./components/SettingsPanel";

export default function App() {
  const [preferences, setPreferences] = usePreferences();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [goals, setGoals] = useState<GoalConfigType>({
    targets: {
      calories: preferences.defaults.calories,
      protein: preferences.defaults.protein,
      carbs: preferences.defaults.carbs,
      fat: preferences.defaults.fat,
    },
    weeklyBudget: preferences.defaults.budget,
    tolerance: preferences.defaults.tolerance,
  });
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<InfeasibilityDiagnostic[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [solving, setSolving] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const addFood = useCallback((food: FoodItem) => {
    setFoods((prev) => [...prev, food]);
  }, []);

  const removeFood = useCallback((id: string) => {
    setFoods((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateFood = useCallback((id: string, updates: Partial<Pick<FoodItem, "weight_g" | "price_usd">>) => {
    setFoods((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  function handleOptimize() {
    setSolving(true);
    setDiagnostics([]);

    // Use setTimeout to let the UI update with the spinner
    setTimeout(() => {
      const res = optimize(foods, goals);
      if (res.feasible) {
        setResult(res);
        setDiagnostics([]);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } else {
        setResult(null);
        const diag = diagnoseInfeasibility(foods, goals);
        setDiagnostics(diag);
      }
      setSolving(false);
    }, 50);
  }

  const canOptimize = foods.length >= MIN_FOODS_TO_OPTIMIZE;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">
            Nutri<span className="text-blue-600">Cost</span>Optimizer
          </h1>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="lg:flex lg:gap-6">
          {/* Sidebar */}
          <div className="lg:w-[400px] lg:shrink-0 space-y-4">
            <FoodInput onAddFood={addFood} aiEnabled={preferences.ai.enabled && !!preferences.ai.key} />
            <FoodList foods={foods} onRemove={removeFood} onUpdate={updateFood} />
            <GoalConfig config={goals} onChange={setGoals} />

            {/* Optimize button */}
            <div>
              {!canOptimize && foods.length > 0 && (
                <p className="text-xs text-amber-600 mb-2 text-center">
                  Add at least {MIN_FOODS_TO_OPTIMIZE} foods to optimize.
                </p>
              )}
              <button
                onClick={handleOptimize}
                disabled={!canOptimize || solving}
                className="w-full bg-blue-600 text-white rounded-xl py-3 text-base font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {solving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Optimizing...
                  </span>
                ) : (
                  "Optimize Meal Plan"
                )}
              </button>
            </div>
          </div>

          {/* Results panel */}
          <div className="flex-1 mt-6 lg:mt-0" ref={resultsRef}>
            {diagnostics.length > 0 && <InfeasibilityPanel diagnostics={diagnostics} />}
            {result && <ResultsDashboard result={result} goals={goals} />}
            {!result && diagnostics.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
                <div className="text-4xl mb-3">&#127860;</div>
                <p className="text-lg font-medium text-gray-500">Your optimized meal plan will appear here</p>
                <p className="text-sm mt-1">Add foods, set your targets, and hit Optimize</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile fixed optimize button */}
      {canOptimize && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <button
            onClick={handleOptimize}
            disabled={solving}
            className="w-full bg-blue-600 text-white rounded-xl py-3 text-base font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {solving ? "Optimizing..." : "Optimize Meal Plan"}
          </button>
        </div>
      )}

      {/* Settings */}
      {showSettings && (
        <SettingsPanel
          preferences={preferences}
          onUpdate={setPreferences}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
