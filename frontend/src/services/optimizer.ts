import type { FoodItem, GoalConfig, OptimizationResult, OptimizedFood, InfeasibilityDiagnostic } from "../types";
import solver from "javascript-lp-solver";

const MAX_GRAMS_PER_FOOD = 1500;

interface LPModel {
  optimize: string;
  opType: string;
  constraints: Record<string, { min?: number; max?: number }>;
  variables: Record<string, Record<string, number>>;
}

function buildModel(foods: FoodItem[], goals: GoalConfig): LPModel {
  const t = goals.tolerance / 100;
  const dailyBudget = goals.weeklyBudget / 7;

  const constraints: Record<string, { min?: number; max?: number }> = {
    calories_min: { min: goals.targets.calories * (1 - t) },
    calories_max: { max: goals.targets.calories * (1 + t) },
    protein_min: { min: goals.targets.protein * (1 - t) },
    protein_max: { max: goals.targets.protein * (1 + t) },
    carbs_min: { min: goals.targets.carbs * (1 - t) },
    carbs_max: { max: goals.targets.carbs * (1 + t) },
    fat_min: { min: goals.targets.fat * (1 - t) },
    fat_max: { max: goals.targets.fat * (1 + t) },
    budget: { max: dailyBudget },
  };

  const variables: Record<string, Record<string, number>> = {};

  for (const food of foods) {
    if (food.weight_g <= 0) continue;
    const n = food.nutrition;
    const costPerGram = food.price_usd / food.weight_g;
    const key = food.id;

    variables[key] = {
      cost: costPerGram,
      calories_min: n.calories / 100,
      calories_max: n.calories / 100,
      protein_min: n.protein_g / 100,
      protein_max: n.protein_g / 100,
      carbs_min: n.carbs_g / 100,
      carbs_max: n.carbs_g / 100,
      fat_min: n.fat_g / 100,
      fat_max: n.fat_g / 100,
      budget: costPerGram,
    };

    // Per-food max constraint
    constraints[`max_${key}`] = { max: MAX_GRAMS_PER_FOOD };
    variables[key][`max_${key}`] = 1;
  }

  return {
    optimize: "cost",
    opType: "min",
    constraints,
    variables,
  };
}

export function optimize(foods: FoodItem[], goals: GoalConfig): OptimizationResult {
  const model = buildModel(foods, goals);
  const result = solver.Solve(model);

  if (!result.feasible) {
    return { feasible: false, dailyCost: 0, foods: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
  }

  const optimizedFoods: OptimizedFood[] = [];
  let totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0;

  for (const food of foods) {
    const grams = result[food.id] || 0;
    if (grams < 0.1) continue;

    const n = food.nutrition;
    const cal = (n.calories / 100) * grams;
    const pro = (n.protein_g / 100) * grams;
    const carb = (n.carbs_g / 100) * grams;
    const fat = (n.fat_g / 100) * grams;
    const cost = food.weight_g > 0 ? (food.price_usd / food.weight_g) * grams : 0;

    totalCal += cal;
    totalPro += pro;
    totalCarb += carb;
    totalFat += fat;

    optimizedFoods.push({
      name: food.name,
      grams: Math.round(grams),
      dailyCost: Math.round(cost * 100) / 100,
      calories: Math.round(cal),
      protein: Math.round(pro * 10) / 10,
      carbs: Math.round(carb * 10) / 10,
      fat: Math.round(fat * 10) / 10,
    });
  }

  optimizedFoods.sort((a, b) => b.grams - a.grams);

  return {
    feasible: true,
    dailyCost: Math.round(result.result * 100) / 100,
    foods: optimizedFoods,
    totals: {
      calories: Math.round(totalCal),
      protein: Math.round(totalPro * 10) / 10,
      carbs: Math.round(totalCarb * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
    },
  };
}

export function diagnoseInfeasibility(foods: FoodItem[], goals: GoalConfig): InfeasibilityDiagnostic[] {
  const diagnostics: InfeasibilityDiagnostic[] = [];

  // Try relaxing budget
  const relaxedBudget = { ...goals, weeklyBudget: goals.weeklyBudget * 1.25 };
  if (optimize(foods, relaxedBudget).feasible) {
    const diff = relaxedBudget.weeklyBudget - goals.weeklyBudget;
    diagnostics.push({
      constraint: "budget",
      suggestion: `Increase weekly budget by ~$${diff.toFixed(0)} to find a solution`,
      adjustedValue: relaxedBudget.weeklyBudget,
    });
  }

  // Try relaxing tolerance
  const relaxedTolerance = { ...goals, tolerance: Math.min(goals.tolerance + 10, 20) };
  if (optimize(foods, relaxedTolerance).feasible) {
    diagnostics.push({
      constraint: "tolerance",
      suggestion: `Increase tolerance to ${relaxedTolerance.tolerance}% to find a solution`,
      adjustedValue: relaxedTolerance.tolerance,
    });
  }

  // Try relaxing each macro
  const macros: Array<{ key: keyof typeof goals.targets; label: string }> = [
    { key: "protein", label: "protein" },
    { key: "calories", label: "calorie" },
    { key: "carbs", label: "carb" },
    { key: "fat", label: "fat" },
  ];

  for (const macro of macros) {
    const relaxed = { ...goals, targets: { ...goals.targets, [macro.key]: goals.targets[macro.key] * 0.75 } };
    if (optimize(foods, relaxed).feasible) {
      const diff = goals.targets[macro.key] - relaxed.targets[macro.key];
      const unit = macro.key === "calories" ? "kcal" : "g";
      diagnostics.push({
        constraint: macro.key,
        suggestion: `Reduce ${macro.label} target by ~${Math.round(diff)}${unit} to find a solution`,
        adjustedValue: relaxed.targets[macro.key],
      });
    }
  }

  if (diagnostics.length === 0) {
    diagnostics.push({
      constraint: "general",
      suggestion: "Your targets and budget are too far apart — adjust your goals or add more food options.",
    });
  }

  return diagnostics;
}
