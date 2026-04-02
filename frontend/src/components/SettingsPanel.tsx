import type { Preferences } from "../types";

interface Props {
  preferences: Preferences;
  onUpdate: (prefs: Preferences) => void;
  onClose: () => void;
}

export default function SettingsPanel({ preferences, onUpdate, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <div className="p-4 space-y-6">
          {/* AI Configuration */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Configuration</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">API Endpoint URL</label>
                <input
                  type="text"
                  value={preferences.ai.endpoint}
                  onChange={(e) => onUpdate({ ...preferences, ai: { ...preferences.ai, endpoint: e.target.value } })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="https://api.openai.com/v1/chat/completions"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">API Key</label>
                <input
                  type="password"
                  value={preferences.ai.key}
                  onChange={(e) => onUpdate({ ...preferences, ai: { ...preferences.ai, key: e.target.value } })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Model Name</label>
                <input
                  type="text"
                  value={preferences.ai.model}
                  onChange={(e) => onUpdate({ ...preferences, ai: { ...preferences.ai, model: e.target.value } })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="gpt-4o-mini"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.ai.enabled}
                  onChange={(e) => onUpdate({ ...preferences, ai: { ...preferences.ai, enabled: e.target.checked } })}
                  className="rounded accent-blue-600"
                />
                <span className="text-sm text-gray-700">Enable AI Input</span>
              </label>
            </div>
          </section>

          {/* Default Preferences */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Default Targets</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "calories", label: "Calories (kcal)" },
                { key: "protein", label: "Protein (g)" },
                { key: "carbs", label: "Carbs (g)" },
                { key: "fat", label: "Fat (g)" },
                { key: "budget", label: "Weekly Budget ($)" },
                { key: "tolerance", label: "Tolerance (%)" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-1">{label}</label>
                  <input
                    type="number"
                    min="0"
                    value={preferences.defaults[key as keyof typeof preferences.defaults]}
                    onChange={(e) =>
                      onUpdate({
                        ...preferences,
                        defaults: { ...preferences.defaults, [key]: parseInt(e.target.value) || 0 },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
