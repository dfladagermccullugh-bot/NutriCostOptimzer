import type { FoodItem, GoalConfig } from "../types";
import { isUsableFood } from "./food";

// Snapshot panel (PRD §1A): pure arithmetic on the basket the user already buys.
// No solver. Interprets each food's weight_g/price_usd as the WEEKLY amount purchased and its
// weekly cost; daily = weekly / 7. Makes the cost<->macro interaction legible.

const DAYS = 7;

const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;
const round0 = (n: number) => Math.round(n);

export interface FoodSnapshot {
  id: string;
  name: string;
  dailyGrams: number;
  dailyCost: number;
  weeklyGrams: number;
  weeklyCost: number;
  // Daily macros this food contributes.
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Share of total daily spend, 0–100.
  spendSharePct: number;
  // Cost efficiency: $ per gram of each macro this food provides (null when it provides ~none).
  costPerGProtein: number | null;
  costPerGCarbs: number | null;
  costPerGFat: number | null;
}

export type MacroStatus = "under" | "over" | "on";

export interface MacroGap {
  achieved: number;
  target: number;
  delta: number; // achieved - target
  pct: number; // delta as % of target (0 when target is 0)
  status: MacroStatus;
}

export interface SnapshotResult {
  hasData: boolean;
  foods: FoodSnapshot[];
  totals: {
    dailyCost: number;
    weeklyCost: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  // Weekly spend attributed to each macro by calorie share — sums (with unattributed) to weekly cost.
  moneyByMacro: { protein: number; carbs: number; fat: number; unattributed: number };
  gaps: { calories: MacroGap; protein: MacroGap; carbs: MacroGap; fat: MacroGap };
}

function macroGap(achieved: number, target: number, tolerance: number): MacroGap {
  const delta = achieved - target;
  const pct = target > 0 ? (delta / target) * 100 : 0;
  const within = target > 0 ? Math.abs(delta) <= target * (tolerance / 100) : delta === 0;
  const status: MacroStatus = within ? "on" : delta < 0 ? "under" : "over";
  return { achieved: round1(achieved), target, delta: round1(delta), pct: round1(pct), status };
}

export function computeSnapshot(foods: FoodItem[], goals: GoalConfig): SnapshotResult {
  const usable = foods.filter(isUsableFood);

  // First pass: raw daily cost to compute spend shares.
  const rawDailyCost = usable.reduce((s, f) => s + f.price_usd / DAYS, 0);

  const foodSnaps: FoodSnapshot[] = usable.map((f) => {
    const n = f.nutrition;
    const weeklyGrams = f.weight_g;
    const weeklyCost = f.price_usd;
    const dailyGrams = weeklyGrams / DAYS;
    const dailyCost = weeklyCost / DAYS;
    const dailyFactor = dailyGrams / 100;

    // Per-package macro grams drive the cost-per-macro ratio (daily vs weekly cancels out).
    const proteinTotalG = (n.protein_g * weeklyGrams) / 100;
    const carbsTotalG = (n.carbs_g * weeklyGrams) / 100;
    const fatTotalG = (n.fat_g * weeklyGrams) / 100;

    return {
      id: f.id,
      name: f.name,
      dailyGrams: round0(dailyGrams),
      dailyCost: round2(dailyCost),
      weeklyGrams: round0(weeklyGrams),
      weeklyCost: round2(weeklyCost),
      calories: round0(n.calories * dailyFactor),
      protein: round1(n.protein_g * dailyFactor),
      carbs: round1(n.carbs_g * dailyFactor),
      fat: round1(n.fat_g * dailyFactor),
      spendSharePct: rawDailyCost > 0 ? round1((dailyCost / rawDailyCost) * 100) : 0,
      costPerGProtein: proteinTotalG > 0 ? round2(weeklyCost / proteinTotalG) : null,
      costPerGCarbs: carbsTotalG > 0 ? round2(weeklyCost / carbsTotalG) : null,
      costPerGFat: fatTotalG > 0 ? round2(weeklyCost / fatTotalG) : null,
    };
  });

  // Totals are summed from the ALREADY-ROUNDED per-food values so the UI always reconciles (audit H5).
  const totals = {
    dailyCost: round2(foodSnaps.reduce((s, f) => s + f.dailyCost, 0)),
    weeklyCost: round2(foodSnaps.reduce((s, f) => s + f.weeklyCost, 0)),
    calories: round0(foodSnaps.reduce((s, f) => s + f.calories, 0)),
    protein: round1(foodSnaps.reduce((s, f) => s + f.protein, 0)),
    carbs: round1(foodSnaps.reduce((s, f) => s + f.carbs, 0)),
    fat: round1(foodSnaps.reduce((s, f) => s + f.fat, 0)),
  };

  // "Where your money goes": attribute each food's weekly cost across macros by calorie share.
  let mProtein = 0;
  let mCarbs = 0;
  let mFat = 0;
  let mUnattributed = 0;
  for (const f of usable) {
    const n = f.nutrition;
    const pc = (n.protein_g * f.weight_g) / 100 * 4;
    const cc = (n.carbs_g * f.weight_g) / 100 * 4;
    const fc = (n.fat_g * f.weight_g) / 100 * 9;
    const tot = pc + cc + fc;
    if (tot > 0) {
      mProtein += (f.price_usd * pc) / tot;
      mCarbs += (f.price_usd * cc) / tot;
      mFat += (f.price_usd * fc) / tot;
    } else {
      mUnattributed += f.price_usd;
    }
  }

  const t = goals.tolerance;
  return {
    hasData: foodSnaps.length > 0,
    foods: foodSnaps,
    totals,
    moneyByMacro: {
      protein: round2(mProtein),
      carbs: round2(mCarbs),
      fat: round2(mFat),
      unattributed: round2(mUnattributed),
    },
    gaps: {
      calories: macroGap(totals.calories, goals.targets.calories, t),
      protein: macroGap(totals.protein, goals.targets.protein, t),
      carbs: macroGap(totals.carbs, goals.targets.carbs, t),
      fat: macroGap(totals.fat, goals.targets.fat, t),
    },
  };
}
