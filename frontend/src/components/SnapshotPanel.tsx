import type { SnapshotResult, MacroGap } from "../services/snapshot";

interface Props {
  snapshot: SnapshotResult;
}

const MACRO_COLOR: Record<string, string> = {
  protein: "#6366F1", // indigo
  carbs: "#F59E0B", // amber
  fat: "#F43F5E", // rose
};

function statusStyle(status: MacroGap["status"]) {
  if (status === "on") return { text: "text-green-700", bg: "bg-green-50", label: "on target" };
  if (status === "under") return { text: "text-amber-700", bg: "bg-amber-50", label: "under" };
  return { text: "text-red-700", bg: "bg-red-50", label: "over" };
}

function GapRow({ label, unit, gap }: { label: string; unit: string; gap: MacroGap }) {
  const s = statusStyle(gap.status);
  const sign = gap.delta > 0 ? "+" : "";
  return (
    <div className="flex items-center justify-between py-2">
      <div className="text-sm text-gray-700">{label}</div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-gray-900">
          {gap.achieved}
          <span className="text-gray-400"> / {gap.target} {unit}</span>
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text} min-w-[88px] text-center`}>
          {gap.status === "on" ? s.label : `${s.label} ${sign}${gap.delta}${unit === "kcal" ? "" : unit}`}
        </span>
      </div>
    </div>
  );
}

export default function SnapshotPanel({ snapshot }: Props) {
  const { totals, foods, moneyByMacro, gaps } = snapshot;

  const moneyTotal = moneyByMacro.protein + moneyByMacro.carbs + moneyByMacro.fat + moneyByMacro.unattributed;
  const moneyRows = [
    { key: "protein", label: "Protein", value: moneyByMacro.protein },
    { key: "carbs", label: "Carbs", value: moneyByMacro.carbs },
    { key: "fat", label: "Fat", value: moneyByMacro.fat },
  ];

  // Cheapest protein sources (audit-driven efficiency insight): lower $/g is better.
  const proteinRanked = foods
    .filter((f) => f.costPerGProtein !== null)
    .sort((a, b) => (a.costPerGProtein as number) - (b.costPerGProtein as number));

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Weekly Spend", value: `$${totals.weeklyCost.toFixed(2)}` },
          { label: "Daily Spend", value: `$${totals.dailyCost.toFixed(2)}` },
          { label: "Daily Calories", value: `${totals.calories}` },
          { label: "Foods", value: `${foods.length}` },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <div className="text-xs text-gray-500">{card.label}</div>
            <div className="text-xl font-bold text-gray-900 font-mono">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Macros vs targets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-1">Your macros vs. targets</h3>
        <p className="text-xs text-gray-500 mb-2">What your current basket delivers per day.</p>
        <div className="divide-y divide-gray-100">
          <GapRow label="Calories" unit="kcal" gap={gaps.calories} />
          <GapRow label="Protein" unit="g" gap={gaps.protein} />
          <GapRow label="Carbs" unit="g" gap={gaps.carbs} />
          <GapRow label="Fat" unit="g" gap={gaps.fat} />
        </div>
      </div>

      {/* Where your money goes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-1">Where your money goes</h3>
        <p className="text-xs text-gray-500 mb-3">Weekly spend attributed across macros by calorie share.</p>
        <div className="space-y-2">
          {moneyRows.map((row) => {
            const pct = moneyTotal > 0 ? (row.value / moneyTotal) * 100 : 0;
            return (
              <div key={row.key}>
                <div className="flex justify-between text-sm mb-0.5">
                  <span className="text-gray-700">{row.label}</span>
                  <span className="font-mono text-gray-900">${row.value.toFixed(2)} <span className="text-gray-400">({pct.toFixed(0)}%)</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: MACRO_COLOR[row.key] }} />
                </div>
              </div>
            );
          })}
          {moneyByMacro.unattributed > 0 && (
            <div className="text-xs text-gray-400 pt-1">
              ${moneyByMacro.unattributed.toFixed(2)}/wk from foods with no protein/carb/fat (e.g. flavorings).
            </div>
          )}
        </div>
      </div>

      {/* Cheapest protein sources */}
      {proteinRanked.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-1">Most cost-efficient protein</h3>
          <p className="text-xs text-gray-500 mb-3">Cost per gram of protein — cheapest first.</p>
          <div className="divide-y divide-gray-100">
            {proteinRanked.map((f, i) => (
              <div key={f.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-gray-700 truncate">
                  <span className="text-gray-400 mr-2">{i + 1}.</span>
                  {f.name}
                </span>
                <span className="font-mono text-gray-900">${(f.costPerGProtein as number).toFixed(2)}/g</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-food breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Per-food breakdown (daily)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs">
              <tr>
                <th className="text-left px-4 py-2">Food</th>
                <th className="text-right px-4 py-2">Amount</th>
                <th className="text-right px-4 py-2">Cost</th>
                <th className="text-right px-4 py-2">Spend</th>
                <th className="text-right px-4 py-2">Cal</th>
                <th className="text-right px-4 py-2">Protein</th>
                <th className="text-right px-4 py-2">Carbs</th>
                <th className="text-right px-4 py-2">Fat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {foods.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">{f.name}</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-700">{f.dailyGrams}g</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-700">${f.dailyCost.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-500">{f.spendSharePct}%</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-600">{f.calories}</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-600">{f.protein}g</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-600">{f.carbs}g</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-600">{f.fat}g</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2 text-right font-mono">${totals.dailyCost.toFixed(2)}</td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2 text-right font-mono">{totals.calories}</td>
                <td className="px-4 py-2 text-right font-mono">{totals.protein}g</td>
                <td className="px-4 py-2 text-right font-mono">{totals.carbs}g</td>
                <td className="px-4 py-2 text-right font-mono">{totals.fat}g</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
