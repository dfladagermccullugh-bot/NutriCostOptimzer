import { describe, it, expect } from "vitest";
import { computeTune } from "./tune";
import type { FoodItem, GoalConfig } from "../types";

function food(over: Partial<FoodItem> & { id: string }): FoodItem {
  return {
    name: over.id,
    weight_g: 1000,
    price_usd: 5,
    nutrition: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    source: "manual",
    ...over,
  };
}

// Current daily: chicken 100g, rice 200g.
const chicken = food({ id: "chicken", weight_g: 700, price_usd: 7, nutrition: { calories: 120, protein_g: 22.5, carbs_g: 0, fat_g: 2.6 } });
const rice = food({ id: "rice", weight_g: 1400, price_usd: 2.8, nutrition: { calories: 365, protein_g: 7.1, carbs_g: 80, fat_g: 0.7 } });

// Targets close to current basket (protein ~36.7, carbs ~160, fat ~4).
const goals: GoalConfig = {
  targets: { calories: 850, protein: 36, carbs: 150, fat: 4 },
  weeklyBudget: 100,
  tolerance: 10,
};

describe("computeTune", () => {
  it("keeps every food in the basket (none dropped to zero)", () => {
    const r = computeTune([chicken, rice], goals, 50);
    expect(r.feasible).toBe(true);
    expect(r.foods).toHaveLength(2);
    for (const f of r.foods) expect(f.tunedGrams).toBeGreaterThan(0);
  });

  it("respects the ±variance bounds around each food's current amount", () => {
    const r = computeTune([chicken, rice], goals, 50);
    const byId = Object.fromEntries(r.foods.map((f) => [f.id, f]));
    // chicken current 100g → [50,150]; rice current 200g → [100,300] (±1 for rounding)
    expect(byId.chicken.tunedGrams).toBeGreaterThanOrEqual(49);
    expect(byId.chicken.tunedGrams).toBeLessThanOrEqual(151);
    expect(byId.rice.tunedGrams).toBeGreaterThanOrEqual(99);
    expect(byId.rice.tunedGrams).toBeLessThanOrEqual(301);
  });

  it("hits the macro targets within tolerance", () => {
    const r = computeTune([chicken, rice], goals, 50);
    expect(r.gaps?.protein.status).toBe("on");
    expect(r.gaps?.carbs.status).toBe("on");
    expect(r.gaps?.fat.status).toBe("on");
  });

  it("never costs more than the current basket (savings >= 0 when current is feasible)", () => {
    const r = computeTune([chicken, rice], goals, 50);
    expect(r.weeklySavings).toBeGreaterThanOrEqual(0);
    expect(r.tuned.weeklyCost).toBeLessThanOrEqual(r.current.weeklyCost + 0.01);
  });

  it("is infeasible at 0% variance when the current basket misses the target", () => {
    const hard: GoalConfig = { ...goals, targets: { ...goals.targets, protein: 60 } };
    const r = computeTune([chicken, rice], hard, 0);
    expect(r.feasible).toBe(false);
    // current totals are still reported so the UI can explain the gap
    expect(r.current.protein).toBeGreaterThan(0);
  });

  it("excludes unusable foods (audit C1)", () => {
    const freebie = food({ id: "free", price_usd: 0, weight_g: 700, nutrition: { calories: 100, protein_g: 25, carbs_g: 0, fat_g: 0 } });
    const r = computeTune([chicken, rice, freebie], goals, 50);
    expect(r.foods.map((f) => f.id).sort()).toEqual(["chicken", "rice"]);
  });
});
