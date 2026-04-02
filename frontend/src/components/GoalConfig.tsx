import type { GoalConfig as GoalConfigType } from "../types";

interface Props {
  config: GoalConfigType;
  onChange: (config: GoalConfigType) => void;
}

export default function GoalConfig({ config, onChange }: Props) {
  function updateTarget(key: string, value: number) {
    onChange({ ...config, targets: { ...config.targets, [key]: value } });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Daily Targets</h2>

      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "calories", label: "Calories", unit: "kcal" },
          { key: "protein", label: "Protein", unit: "g" },
          { key: "carbs", label: "Carbs", unit: "g" },
          { key: "fat", label: "Fat", unit: "g" },
        ].map(({ key, label, unit }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {label} ({unit})
            </label>
            <input
              type="number"
              min="0"
              value={config.targets[key as keyof typeof config.targets]}
              onChange={(e) => updateTarget(key, parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      <div className="mt-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Weekly Budget ($)
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={config.weeklyBudget}
          onChange={(e) => onChange({ ...config, weeklyBudget: parseInt(e.target.value) || 0 })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mt-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Tolerance: {config.tolerance}%
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={config.tolerance}
          onChange={(e) => onChange({ ...config, tolerance: parseInt(e.target.value) })}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>1%</span>
          <span>20%</span>
        </div>
      </div>
    </div>
  );
}
