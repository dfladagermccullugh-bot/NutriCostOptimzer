import type { OptimizationResult } from "../types";

export function copyPlanToClipboard(result: OptimizationResult): Promise<void> {
  const date = new Date().toISOString().split("T")[0];
  const weeklyCost = (result.dailyCost * 7).toFixed(2);

  let text = `NutriCostOptimizer Plan — ${date}\n`;
  text += `Daily Cost: $${result.dailyCost.toFixed(2)} | Weekly Cost: $${weeklyCost}\n\n`;
  text += "DAILY PLAN\n";

  for (const food of result.foods) {
    text += `${food.name.padEnd(24)}${String(food.grams + "g").padStart(6)}    $${food.dailyCost.toFixed(2)}\n`;
  }

  text += "\nWEEKLY SHOPPING LIST\n";
  for (const food of result.foods) {
    const weeklyG = food.grams * 7;
    const weeklyKg = weeklyG >= 1000 ? ` (${(weeklyG / 1000).toFixed(2)}kg)` : "";
    const weeklyCostFood = (food.dailyCost * 7).toFixed(2);
    text += `${food.name.padEnd(24)}${String(weeklyG + "g").padStart(7)}${weeklyKg.padEnd(10)}$${weeklyCostFood}\n`;
  }

  return navigator.clipboard.writeText(text);
}

export async function exportPDF(result: OptimizationResult): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF();
  const date = new Date().toISOString().split("T")[0];

  doc.setFontSize(18);
  doc.text("NutriCostOptimizer Plan", 14, 20);
  doc.setFontSize(11);
  doc.text(date, 14, 28);

  // Summary
  const weeklyCost = (result.dailyCost * 7).toFixed(2);
  doc.setFontSize(12);
  doc.text(`Daily Cost: $${result.dailyCost.toFixed(2)}  |  Weekly Cost: $${weeklyCost}`, 14, 38);
  doc.text(
    `Totals: ${result.totals.calories} kcal, ${result.totals.protein}g protein, ${result.totals.carbs}g carbs, ${result.totals.fat}g fat`,
    14, 46
  );

  // Daily plan table
  (doc as any).autoTable({
    startY: 54,
    head: [["Food", "Amount (g)", "Cost ($)", "Cal", "Protein (g)", "Carbs (g)", "Fat (g)"]],
    body: result.foods.map((f) => [f.name, f.grams, f.dailyCost.toFixed(2), f.calories, f.protein, f.carbs, f.fat]),
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Weekly shopping list
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.text("Weekly Shopping List", 14, finalY);

  (doc as any).autoTable({
    startY: finalY + 4,
    head: [["Food", "Weekly Amount", "Weekly Cost ($)"]],
    body: result.foods.map((f) => {
      const wg = f.grams * 7;
      const amount = wg >= 1000 ? `${wg}g (${(wg / 1000).toFixed(2)}kg)` : `${wg}g`;
      return [f.name, amount, (f.dailyCost * 7).toFixed(2)];
    }),
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`nutricost-plan-${date}.pdf`);
}
