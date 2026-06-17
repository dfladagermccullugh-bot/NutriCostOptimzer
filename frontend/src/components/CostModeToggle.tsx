import type { CostMode } from "../services/optimizer";

interface Props {
  value: CostMode;
  onChange: (mode: CostMode) => void;
}

const OPTIONS: { key: CostMode; label: string }[] = [
  { key: "minimize", label: "Minimize spend" },
  { key: "budget", label: "Target budget" },
];

export default function CostModeToggle({ value, onChange }: Props) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5 text-sm">
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`flex-1 px-3 py-1.5 rounded-md transition-colors ${
            value === o.key ? "bg-white shadow-sm text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
