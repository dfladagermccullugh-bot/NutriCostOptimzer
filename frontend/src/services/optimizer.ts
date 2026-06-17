import type { FoodItem, GoalConfig, OptimizationResult, OptimizedFood, InfeasibilityDiagnostic } from "../types";
import solver from "javascript-lp-solver";
import { isUsableFood } from "./food";

const MAX_GRAMS_PER_FOOD = 1500;
// In budget mode, macro deviation is minimized; this weight makes hitting macros dominate cost,
// while cost remains a tiebreaker so the solution is also the cheapest way to reach that fit.
const DEVIATION_WEIGHT = 1000;

export type CostMode = "minimize" | "budget";

export interface OptimizeOptions {
  costMode?: CostMode;
}

interface LPModel {
  optimize: string;
  opType: string;
  constraints: Record<string, { min?: number; max?: number }>;
  variables: Record<string, Record<string, number>>;
}

// Minimize total cost subject to hitting protein/carbs/fat within tolerance and staying under budget.
// Calories are intentionally NOT constrained (audit H2) — they are derived and reported, never a
// hard bound that can fight the macro bands.
function buildMinimizeModel(foods: FoodItem[], goals: GoalConfig): LPModel {
  const t = goals.tolerance / 100;
  const dailyBudget = goals.weeklyBudget / 7;

  const constraints: Record<string, { min?: number; max?: number }> = {
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
    if (!isUsableFood(food)) continue;
    const n = food.nutrition;
    const costPerGram = food.price_usd / food.weight_g;
    const key = food.id;
    variables[key] = {
      cost: costPerGram,
      protein_min: n.protein_g / 100,
      protein_max: n.protein_g / 100,
      carbs_min: n.carbs_g / 100,
      carbs_max: n.carbs_g / 100,
      fat_min: n.fat_g / 100,
      fat_max: n.fat_g / 100,
      budget: costPerGram,
    };
    constraints[`max_${key}`] = { max: MAX_GRAMS_PER_FOOD };
    variables[key][`max_${key}`] = 1;
  }

  return { optimize: "cost", opType: "min", constraints, variables };
}

// Respect a target budget: cap cost at the daily budget, then get as close to the protein/carbs/fat
// targets as possible (minimize normalized deviation). Cost is a tiebreaker. Calories derived (H2).
function buildBudgetModel(foods: FoodItem[], goals: GoalConfig): LPModel {
  const dailyBudget = goals.weeklyBudget / 7;

  const constraints: Record<string, { min?: number; max?: number }> = {
    budget: { max: dailyBudget },
  };

  const variables: Record<string, Record<string, number>> = {};
  for (const food of foods) {
    if (!isUsableFood(food)) continue;
    const n = food.nutrition;
    const costPerGram = food.price_usd / food.weight_g;
    const key = food.id;
    variables[key] = {
      fit: costPerGram, // cost tiebreaker in the objective
      budget: costPerGram,
      dpos_protein: n.protein_g / 100,
      dneg_protein: n.protein_g / 100,
      dpos_carbs: n.carbs_g / 100,
      dneg_carbs: n.carbs_g / 100,
      dpos_fat: n.fat_g / 100,
      dneg_fat: n.fat_g / 100,
    };
    constraints[`max_${key}`] = { max: MAX_GRAMS_PER_FOOD };
    variables[key][`max_${key}`] = 1;
  }

  // Absolute-deviation variables: d_m >= |achieved_m - target_m|, minimized in the objective.
  for (const m of ["protein", "carbs", "fat"] as const) {
    const target = goals.targets[m];
    constraints[`dpos_${m}`] = { max: target }; // achieved - d <= target
    constraints[`dneg_${m}`] = { min: target }; // achieved + d >= target
    variables[`d_${m}`] = {
      fit: DEVIATION_WEIGHT / (target > 0 ? target : 1),
      [`dpos_${m}`]: -1,
      [`dneg_${m}`]: 1,
    };
  }

  return { optimize: "fit", opType: "min", constraints, variables };
}

export function optimize(foods: FoodItem[], goals: GoalConfig, options: OptimizeOptions = {}): OptimizationResult {
  const costMode = options.costMode ?? "minimize";
  const model = costMode === "budget" ? buildBudgetModel(foods, goals) : buildMinimizeModel(foods, goals);
  const result = solver.Solve(model);

  if (!result.feasible) {
    return { feasible: false, dailyCost: 0, foods: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
  }

  const optimizedFoods: OptimizedFood[] = [];
  let totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0, totalCost = 0;

  for (const food of foods) {
    const grams = (result as Record<string, number>)[food.id] || 0;
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
    totalCost += cost;

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

  // Totals summed from the rounded rows so the dashboard reconciles (audit H5). Cost comes from the
  // actual allocation, not result.result (which is the deviation objective in budget mode).
  return {
    feasible: true,
    dailyCost: Math.round(totalCost * 100) / 100,
    foods: optimizedFoods,
    totals: {
      calories: optimizedFoods.reduce((s, f) => s + f.calories, 0),
      protein: Math.round(optimizedFoods.reduce((s, f) => s + f.protein, 0) * 10) / 10,
      carbs: Math.round(optimizedFoods.reduce((s, f) => s + f.carbs, 0) * 10) / 10,
      fat: Math.round(optimizedFoods.reduce((s, f) => s + f.fat, 0) * 10) / 10,
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

  // Try relaxing each macro (calories are not a constraint anymore — audit H2)
  const macros: Array<{ key: keyof typeof goals.targets; label: string }> = [
    { key: "protein", label: "protein" },
    { key: "carbs", label: "carb" },
    { key: "fat", label: "fat" },
  ];

  for (const macro of macros) {
    const relaxed = { ...goals, targets: { ...goals.targets, [macro.key]: goals.targets[macro.key] * 0.75 } };
    if (optimize(foods, relaxed).feasible) {
      const diff = goals.targets[macro.key] - relaxed.targets[macro.key];
      diagnostics.push({
        constraint: macro.key,
        suggestion: `Reduce ${macro.label} target by ~${Math.round(diff)}g to find a solution`,
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
