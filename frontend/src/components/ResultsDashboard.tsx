import type { OptimizationResult, GoalConfig } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { copyPlanToClipboard, exportPDF } from "../services/exporter";
import { useState } from "react";

interface Props {
  result: OptimizationResult;
  goals: GoalConfig;
}

export default function ResultsDashboard({ result, goals }: Props) {
  const [copied, setCopied] = useState(false);
  const weeklyCost = Math.round(result.dailyCost * 7 * 100) / 100;
  const budgetRemaining = Math.round((goals.weeklyBudget - weeklyCost) * 100) / 100;

  const chartData = [
    { name: "Calories", achieved: result.totals.calories, target: goals.targets.calories, unit: "kcal" },
    { name: "Protein", achieved: result.totals.protein, target: goals.targets.protein, unit: "g" },
    { name: "Carbs", achieved: result.totals.carbs, target: goals.targets.carbs, unit: "g" },
    { name: "Fat", achieved: result.totals.fat, target: goals.targets.fat, unit: "g" },
  ];

  const t = goals.tolerance / 100;

  function isInRange(achieved: number, target: number) {
    return achieved >= target * (1 - t) && achieved <= target * (1 + t);
  }

  async function handleCopy() {
    await copyPlanToClipboard(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Daily Cost", value: `$${result.dailyCost.toFixed(2)}` },
          { label: "Weekly Cost", value: `$${weeklyCost.toFixed(2)}` },
          { label: "Budget Remaining", value: `$${budgetRemaining.toFixed(2)}` },
          { label: "Foods Used", value: `${result.foods.length}` },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <div className="text-xs text-gray-500">{card.label}</div>
            <div className="text-xl font-bold text-gray-900 font-mono">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Daily plan table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Optimal Daily Plan</h3>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? "Copied!" : "Copy Plan"}
            </button>
            <button
              onClick={() => exportPDF(result)}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Export PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs">
              <tr>
                <th className="text-left px-4 py-2">Food</th>
                <th className="text-right px-4 py-2">Amount</th>
                <th className="text-right px-4 py-2">Cost</th>
                <th className="text-right px-4 py-2">Cal</th>
                <th className="text-right px-4 py-2">Protein</th>
                <th className="text-right px-4 py-2">Carbs</th>
                <th className="text-right px-4 py-2">Fat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.foods.map((food) => (
                <tr key={food.name} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">{food.name}</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-700">{food.grams}g</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-700">${food.dailyCost.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-600">{food.calories}</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-600">{food.protein}g</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-600">{food.carbs}g</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-600">{food.fat}g</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-right font-mono">{result.foods.reduce((s, f) => s + f.grams, 0)}g</td>
                <td className="px-4 py-2 text-right font-mono">${result.dailyCost.toFixed(2)}</td>
                <td className="px-4 py-2 text-right font-mono">{result.totals.calories}</td>
                <td className="px-4 py-2 text-right font-mono">{result.totals.protein}g</td>
                <td className="px-4 py-2 text-right font-mono">{result.totals.carbs}g</td>
                <td className="px-4 py-2 text-right font-mono">{result.totals.fat}g</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly shopping list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Weekly Shopping List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs">
              <tr>
                <th className="text-left px-4 py-2">Food</th>
                <th className="text-right px-4 py-2">Weekly Amount</th>
                <th className="text-right px-4 py-2">Weekly Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...result.foods]
                .sort((a, b) => b.dailyCost * 7 - a.dailyCost * 7)
                .map((food) => {
                  const wg = food.grams * 7;
                  return (
                    <tr key={food.name} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{food.name}</td>
                      <td className="px-4 py-2 text-right font-mono text-gray-700">
                        {wg}g{wg >= 1000 ? ` (${(wg / 1000).toFixed(2)}kg)` : ""}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-gray-700">${(food.dailyCost * 7).toFixed(2)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nutrient chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Nutrient Achievement</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 60, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number, _name: string, props: any) => [`${value} ${props.payload.unit}`, "Achieved"]} />
            <Bar dataKey="achieved" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={isInRange(entry.achieved, entry.target) ? "#22c55e" : "#ef4444"}
                />
              ))}
            </Bar>
            {chartData.map((entry) => (
              <ReferenceLine key={entry.name} x={entry.target} stroke="#6b7280" strokeDasharray="4 4" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
