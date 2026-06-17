import { describe, it, expect } from "vitest";
import { optimize } from "./optimizer";
import type { FoodItem, GoalConfig } from "../types";

function food(over: Partial<FoodItem> & { id: string }): FoodItem {
  return {
    name: over.id, // distinct name per food so result lookups are unambiguous
    weight_g: 1000,
    price_usd: 5,
    nutrition: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    source: "manual",
    ...over,
  };
}

// A cheap protein source and a cheap carb source — enough to hit a simple target.
const chicken = food({ id: "chicken", weight_g: 1000, price_usd: 6, nutrition: { calories: 120, protein_g: 22.5, carbs_g: 0, fat_g: 2.6 } });
const rice = food({ id: "rice", weight_g: 1000, price_usd: 2, nutrition: { calories: 365, protein_g: 7.1, carbs_g: 80, fat_g: 0.7 } });
const oil = food({ id: "oil", weight_g: 1000, price_usd: 8, nutrition: { calories: 884, protein_g: 0, carbs_g: 0, fat_g: 100 } });

const goals: GoalConfig = {
  targets: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
  weeklyBudget: 140,
  tolerance: 10,
};

describe("optimize", () => {
  it("finds a feasible plan and reports a positive cost", () => {
    const r = optimize([chicken, rice, oil], goals);
    expect(r.feasible).toBe(true);
    expect(r.dailyCost).toBeGreaterThan(0);
    expect(r.totals.protein).toBeGreaterThan(0);
  });

  it("keeps achieved macros within tolerance of the targets", () => {
    const r = optimize([chicken, rice, oil], goals);
    const within = (a: number, t: number) => a >= t * 0.9 - 1 && a <= t * 1.1 + 1;
    expect(within(r.totals.protein, 150)).toBe(true);
    expect(within(r.totals.carbs, 200)).toBe(true);
    expect(within(r.totals.fat, 60)).toBe(true);
  });

  it("ignores a zero-price food instead of exploiting it as free (audit C1)", () => {
    const freebie = food({ id: "free", price_usd: 0, weight_g: 1000, nutrition: { calories: 100, protein_g: 25, carbs_g: 0, fat_g: 0 } });
    const withFree = optimize([chicken, rice, oil, freebie], goals);
    const free = withFree.foods.find((f) => f.name === freebie.name);
    expect(free).toBeUndefined();
  });
});
