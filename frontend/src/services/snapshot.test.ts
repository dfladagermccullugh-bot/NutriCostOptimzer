import { describe, it, expect } from "vitest";
import { computeSnapshot } from "./snapshot";
import type { FoodItem, GoalConfig } from "../types";

function food(over: Partial<FoodItem> & { id: string }): FoodItem {
  return {
    name: "test",
    weight_g: 100,
    price_usd: 1,
    nutrition: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    source: "manual",
    ...over,
  };
}

const chicken = food({
  id: "chicken",
  name: "Chicken breast",
  weight_g: 700,
  price_usd: 7,
  nutrition: { calories: 120, protein_g: 22.5, carbs_g: 0, fat_g: 2.6 },
});

const rice = food({
  id: "rice",
  name: "White rice",
  weight_g: 1400,
  price_usd: 2.8,
  nutrition: { calories: 365, protein_g: 7.1, carbs_g: 80, fat_g: 0.7 },
});

const goals: GoalConfig = {
  targets: { calories: 850, protein: 40, carbs: 160, fat: 4 },
  weeklyBudget: 100,
  tolerance: 5,
};

describe("computeSnapshot", () => {
  it("reports no data for an empty basket", () => {
    const r = computeSnapshot([], goals);
    expect(r.hasData).toBe(false);
    expect(r.foods).toHaveLength(0);
  });

  it("derives daily amounts and cost from weekly basket (÷7)", () => {
    const r = computeSnapshot([chicken], goals);
    const c = r.foods[0];
    expect(c.weeklyGrams).toBe(700);
    expect(c.dailyGrams).toBe(100);
    expect(c.dailyCost).toBe(1); // $7 / 7
    expect(c.calories).toBe(120);
    expect(c.protein).toBe(22.5);
  });

  it("computes cost-per-gram-of-macro, null when the macro is absent", () => {
    const c = computeSnapshot([chicken], goals).foods[0];
    expect(c.costPerGProtein).toBe(0.04); // 7 / (22.5*700/100=157.5)
    expect(c.costPerGCarbs).toBeNull(); // chicken has no carbs
    expect(c.costPerGFat).toBe(0.38); // 7 / 18.2
  });

  it("totals equal the sum of the rounded per-food rows (audit H5)", () => {
    const r = computeSnapshot([chicken, rice], goals);
    const sumProtein = r.foods.reduce((s, f) => s + f.protein, 0);
    expect(r.totals.protein).toBeCloseTo(sumProtein, 5);
    expect(r.totals.dailyCost).toBe(1.4);
    expect(r.totals.calories).toBe(850);
  });

  it("spend shares are proportional to daily cost", () => {
    const r = computeSnapshot([chicken, rice], goals);
    const byId = Object.fromEntries(r.foods.map((f) => [f.id, f]));
    expect(byId.chicken.spendSharePct).toBe(71.4);
    expect(byId.rice.spendSharePct).toBe(28.6);
  });

  it("attributes weekly spend across macros, summing to total cost", () => {
    const r = computeSnapshot([chicken, rice], goals);
    const m = r.moneyByMacro;
    expect(m.protein + m.carbs + m.fat + m.unattributed).toBeCloseTo(r.totals.weeklyCost, 1);
  });

  it("flags macro gaps relative to target and tolerance", () => {
    const r = computeSnapshot([chicken, rice], goals);
    expect(r.gaps.calories.status).toBe("on"); // 850 == 850
    expect(r.gaps.protein.status).toBe("under"); // 36.7 vs 40, >5% off
    expect(r.gaps.carbs.status).toBe("on");
  });

  it("excludes unusable foods (audit C1: zero price cannot enter analysis)", () => {
    const freebie = food({ id: "free", price_usd: 0, weight_g: 500, nutrition: { calories: 100, protein_g: 20, carbs_g: 0, fat_g: 0 } });
    const r = computeSnapshot([chicken, freebie], goals);
    expect(r.foods.map((f) => f.id)).toEqual(["chicken"]);
  });
});
