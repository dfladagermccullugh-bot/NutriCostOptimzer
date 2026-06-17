import { describe, it, expect } from "vitest";
import { isUsableFood } from "./food";
import type { FoodItem } from "../types";

function food(over: Partial<FoodItem>): FoodItem {
  return {
    id: "x",
    name: "test",
    weight_g: 100,
    price_usd: 1,
    nutrition: { calories: 100, protein_g: 10, carbs_g: 5, fat_g: 2 },
    source: "manual",
    ...over,
  };
}

describe("isUsableFood", () => {
  it("accepts a complete food", () => {
    expect(isUsableFood(food({}))).toBe(true);
  });

  it("rejects zero or negative price (audit C1)", () => {
    expect(isUsableFood(food({ price_usd: 0 }))).toBe(false);
    expect(isUsableFood(food({ price_usd: -2 }))).toBe(false);
  });

  it("rejects zero or negative weight", () => {
    expect(isUsableFood(food({ weight_g: 0 }))).toBe(false);
  });

  it("rejects a food with no macros at all", () => {
    expect(isUsableFood(food({ nutrition: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } }))).toBe(false);
  });
});
