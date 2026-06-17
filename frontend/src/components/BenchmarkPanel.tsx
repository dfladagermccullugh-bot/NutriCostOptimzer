import { useMemo, useState } from "react";
import type { FoodItem, GoalConfig } from "../types";
import { optimize, diagnoseInfeasibility, type CostMode } from "../services/optimizer";
import { isUsableFood } from "../services/food";
import { MIN_FOODS_TO_OPTIMIZE } from "../constants";
import ResultsDashboard from "./ResultsDashboard";
import InfeasibilityPanel from "./InfeasibilityPanel";
import CostModeToggle from "./CostModeToggle";

interface Props {
  foods: FoodItem[];
  goals: GoalConfig;
}

export default function BenchmarkPanel({ foods, goals }: Props) {
  const [costMode, setCostMode] = useState<CostMode>("minimize");

  const usableCount = useMemo(() => foods.filter(isUsableFood).length, [foods]);
  const canOptimize = usableCount >= MIN_FOODS_TO_OPTIMIZE;

  const result = useMemo(
    () => (canOptimize ? optimize(foods, goals, { costMode }) : null),
    [foods, goals, costMode, canOptimize]
  );
  const diagnostics = useMemo(
    () => (canOptimize && result && !result.feasible ? diagnoseInfeasibility(foods, goals) : []),
    [foods, goals, canOptimize, result]
  );

  const budgetMode = costMode === "budget";

  if (!canOptimize) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
        <p className="text-sm">Add at least {MIN_FOODS_TO_OPTIMIZE} foods to compute the theoretical cost floor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <CostModeToggle value={costMode} onChange={setCostMode} />
        <p className="text-xs text-gray-500 mt-2">
          {budgetMode
            ? `The best macros achievable from these foods within $${goals.weeklyBudget}/week — ignoring your current amounts.`
            : "The cheapest possible way to hit your macros from these foods — ignoring your current amounts."}
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
        <strong>Theoretical floor.</strong> A benchmark that may drop foods entirely — not a meal plan.
        Use <em>Tune</em> for a realistic result that keeps your whole basket.
      </div>

      {result && result.feasible && <ResultsDashboard result={result} goals={goals} />}
      {result && !result.feasible && diagnostics.length > 0 && <InfeasibilityPanel diagnostics={diagnostics} />}
    </div>
  );
}
