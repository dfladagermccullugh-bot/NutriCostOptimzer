import solver from "javascript-lp-solver";
import type { FoodItem, GoalConfig } from "../types";
import { isUsableFood } from "./food";
import { macroGap, type MacroGap } from "./snapshot";

// Tune panel (PRD §1A): keep EVERY food the user bought and re-allocate how much of each to hit
// their macros for the least cost. Each food is bounded to ±variance% of its current daily amount,
// so nothing drops to zero. Calories are intentionally NOT hard-constrained (audit H2) — they are a
// derived result, reported with a gap, so a slightly inconsistent calorie target can't force a
// false "infeasible."

const DAYS = 7;
const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;
const round0 = (n: number) => Math.round(n);

export interface TunedFood {
  id: string;
  name: string;
  currentGrams: number; // daily
  tunedGrams: number; // daily
  deltaGrams: number; // tuned - current
  currentCost: number; // daily
  tunedCost: number; // daily
  calories: number; // at tuned amount, daily
  protein: number;
  carbs: number;
  fat: number;
}

export interface TuneTotals {
  dailyCost: number;
  weeklyCost: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface TuneResult {
  feasible: boolean;
  variancePct: number;
  foods: TunedFood[];
  current: TuneTotals;
  tuned: TuneTotals;
  weeklySavings: number; // current.weeklyCost - tuned.weeklyCost
  gaps: { calories: MacroGap; protein: MacroGap; carbs: MacroGap; fat: MacroGap } | null;
}

function totalsOf(rows: { dailyCost: number; calories: number; protein: number; carbs: number; fat: number }[]): TuneTotals {
  const dailyCost = round2(rows.reduce((s, r) => s + r.dailyCost, 0));
  return {
    dailyCost,
    weeklyCost: round2(dailyCost * DAYS),
    calories: round0(rows.reduce((s, r) => s + r.calories, 0)),
    protein: round1(rows.reduce((s, r) => s + r.protein, 0)),
    carbs: round1(rows.reduce((s, r) => s + r.carbs, 0)),
    fat: round1(rows.reduce((s, r) => s + r.fat, 0)),
  };
}

export function computeTune(foods: FoodItem[], goals: GoalConfig, variancePct: number): TuneResult {
  const usable = foods.filter(isUsableFood);
  const v = variancePct / 100;
  const t = goals.tolerance / 100;

  // Current daily snapshot rows (what they buy now).
  const currentRows = usable.map((f) => {
    const factor = f.weight_g / DAYS / 100;
    return {
      dailyCost: f.price_usd / DAYS,
      calories: f.nutrition.calories * factor,
      protein: f.nutrition.protein_g * factor,
      carbs: f.nutrition.carbs_g * factor,
      fat: f.nutrition.fat_g * factor,
    };
  });
  const current = totalsOf(currentRows);

  const empty: TuneResult = {
    feasible: false,
    variancePct,
    foods: [],
    current,
    tuned: { dailyCost: 0, weeklyCost: 0, calories: 0, protein: 0, carbs: 0, fat: 0 },
    weeklySavings: 0,
    gaps: null,
  };
  if (usable.length === 0) return empty;

  const constraints: Record<string, { min?: number; max?: number }> = {
    protein_min: { min: goals.targets.protein * (1 - t) },
    protein_max: { max: goals.targets.protein * (1 + t) },
    carbs_min: { min: goals.targets.carbs * (1 - t) },
    carbs_max: { max: goals.targets.carbs * (1 + t) },
    fat_min: { min: goals.targets.fat * (1 - t) },
    fat_max: { max: goals.targets.fat * (1 + t) },
  };

  const variables: Record<string, Record<string, number>> = {};
  for (const f of usable) {
    const n = f.nutrition;
    const currentDaily = f.weight_g / DAYS;
    const lb = currentDaily * (1 - v);
    const ub = currentDaily * (1 + v);
    const key = f.id;

    variables[key] = {
      cost: f.price_usd / f.weight_g,
      protein_min: n.protein_g / 100,
      protein_max: n.protein_g / 100,
      carbs_min: n.carbs_g / 100,
      carbs_max: n.carbs_g / 100,
      fat_min: n.fat_g / 100,
      fat_max: n.fat_g / 100,
    };
    // Per-food variance bounds — both > 0 so the food is never dropped.
    constraints[`lb_${key}`] = { min: lb };
    constraints[`ub_${key}`] = { max: ub };
    variables[key][`lb_${key}`] = 1;
    variables[key][`ub_${key}`] = 1;
  }

  const res = solver.Solve({ optimize: "cost", opType: "min", constraints, variables });
  if (!res.feasible) return empty;

  const tunedFoods: TunedFood[] = usable.map((f) => {
    const n = f.nutrition;
    const currentDaily = f.weight_g / DAYS;
    const grams = (res as Record<string, number>)[f.id] ?? 0;
    const factor = grams / 100;
    return {
      id: f.id,
      name: f.name,
      currentGrams: round0(currentDaily),
      tunedGrams: round0(grams),
      deltaGrams: round0(grams - currentDaily),
      currentCost: round2((f.price_usd / f.weight_g) * currentDaily),
      tunedCost: round2((f.price_usd / f.weight_g) * grams),
      calories: round0(n.calories * factor),
      protein: round1(n.protein_g * factor),
      carbs: round1(n.carbs_g * factor),
      fat: round1(n.fat_g * factor),
    };
  });

  const tuned = totalsOf(
    tunedFoods.map((f) => ({ dailyCost: f.tunedCost, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat }))
  );

  return {
    feasible: true,
    variancePct,
    foods: tunedFoods,
    current,
    tuned,
    weeklySavings: round2(current.weeklyCost - tuned.weeklyCost),
    gaps: {
      calories: macroGap(tuned.calories, goals.targets.calories, goals.tolerance),
      protein: macroGap(tuned.protein, goals.targets.protein, goals.tolerance),
      carbs: macroGap(tuned.carbs, goals.targets.carbs, goals.tolerance),
      fat: macroGap(tuned.fat, goals.targets.fat, goals.tolerance),
    },
  };
}
