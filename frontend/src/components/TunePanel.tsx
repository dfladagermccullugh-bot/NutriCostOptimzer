import { useMemo, useState } from "react";
import type { FoodItem, GoalConfig } from "../types";
import { computeTune } from "../services/tune";
import type { MacroGap } from "../services/snapshot";

interface Props {
  foods: FoodItem[];
  goals: GoalConfig;
}

function statusStyle(status: MacroGap["status"]) {
  if (status === "on") return { text: "text-green-700", bg: "bg-green-50", label: "on target" };
  if (status === "under") return { text: "text-amber-700", bg: "bg-amber-50", label: "under" };
  return { text: "text-red-700", bg: "bg-red-50", label: "over" };
}

function GapRow({ label, unit, gap }: { label: string; unit: string; gap: MacroGap }) {
  const s = statusStyle(gap.status);
  return (
    <div className="flex items-center justify-between py-2">
      <div className="text-sm text-gray-700">{label}</div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-gray-900">
          {gap.achieved}
          <span className="text-gray-400"> / {gap.target} {unit}</span>
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text} min-w-[72px] text-center`}>
          {s.label}
        </span>
      </div>
    </div>
  );
}

export default function TunePanel({ foods, goals }: Props) {
  const [variance, setVariance] = useState(25);
  const result = useMemo(() => computeTune(foods, goals, variance), [foods, goals, variance]);

  return (
    <div className="space-y-4">
      {/* Variance control */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="font-semibold text-gray-900">Allow variance up to {variance}%</h3>
          <span className="text-xs text-gray-400">flexibility</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          We'll keep every food you bought and suggest eating between{" "}
          <span className="font-medium text-gray-700">{100 - variance}%</span> and{" "}
          <span className="font-medium text-gray-700">{100 + variance}%</span> of each one to hit your macros for less.
        </p>
        <input
          type="range"
          min="0"
          max="75"
          step="5"
          value={variance}
          onChange={(e) => setVariance(parseInt(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0% (no change)</span>
          <span>75% (very flexible)</span>
        </div>
      </div>

      {!result.feasible && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 mb-1">No solution within {variance}% variance</h3>
          <p className="text-sm text-amber-700">
            Your basket can't reach these macro targets while staying within {variance}% of current amounts.
            Try raising the variance above, loosening tolerance, or adjusting your targets.
          </p>
        </div>
      )}

      {result.feasible && result.gaps && (
        <>
          {/* Savings headline */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Current / week</div>
              <div className="text-xl font-bold text-gray-900 font-mono">${result.current.weeklyCost.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Tuned / week</div>
              <div className="text-xl font-bold text-gray-900 font-mono">${result.tuned.weeklyCost.toFixed(2)}</div>
            </div>
            <div className={`rounded-xl shadow-sm border p-3 ${result.weeklySavings > 0 ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}>
              <div className="text-xs text-gray-500">Savings / week</div>
              <div className={`text-xl font-bold font-mono ${result.weeklySavings > 0 ? "text-green-700" : "text-gray-900"}`}>
                ${result.weeklySavings.toFixed(2)}
              </div>
            </div>
          </div>

          {result.weeklySavings <= 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
              Your basket is already cost-efficient for these macros within {variance}% variance — there's nothing to save by re-allocating. Try the <em>Snapshot</em> tab for where your money goes.
            </div>
          )}

          {/* Macros after tuning */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-1">Macros after tuning</h3>
            <p className="text-xs text-gray-500 mb-2">Per day, from the suggested amounts below.</p>
            <div className="divide-y divide-gray-100">
              <GapRow label="Calories" unit="kcal" gap={result.gaps.calories} />
              <GapRow label="Protein" unit="g" gap={result.gaps.protein} />
              <GapRow label="Carbs" unit="g" gap={result.gaps.carbs} />
              <GapRow label="Fat" unit="g" gap={result.gaps.fat} />
            </div>
          </div>

          {/* Suggested amounts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Suggested amounts (daily)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs">
                  <tr>
                    <th className="text-left px-4 py-2">Food</th>
                    <th className="text-right px-4 py-2">Now</th>
                    <th className="text-right px-4 py-2">Suggested</th>
                    <th className="text-right px-4 py-2">Change</th>
                    <th className="text-right px-4 py-2">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.foods.map((f) => {
                    const up = f.deltaGrams > 0;
                    const flat = f.deltaGrams === 0;
                    return (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-900">{f.name}</td>
                        <td className="px-4 py-2 text-right font-mono text-gray-500">{f.currentGrams}g</td>
                        <td className="px-4 py-2 text-right font-mono text-gray-900">{f.tunedGrams}g</td>
                        <td className={`px-4 py-2 text-right font-mono ${flat ? "text-gray-400" : up ? "text-amber-600" : "text-green-600"}`}>
                          {flat ? "—" : `${up ? "+" : ""}${f.deltaGrams}g`}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-700">${f.tunedCost.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-4 py-2">Total</td>
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2 text-right font-mono">${result.tuned.dailyCost.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
