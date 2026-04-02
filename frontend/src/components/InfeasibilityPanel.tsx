import type { InfeasibilityDiagnostic } from "../types";

interface Props {
  diagnostics: InfeasibilityDiagnostic[];
}

export default function InfeasibilityPanel({ diagnostics }: Props) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <h3 className="font-semibold text-red-800 mb-2">No feasible solution found</h3>
      <p className="text-sm text-red-700 mb-3">
        The optimizer couldn't find a meal plan that meets all your targets within budget. Try these suggestions:
      </p>
      <ul className="space-y-2">
        {diagnostics.map((d, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="text-red-400 mt-0.5">&#8226;</span>
            <span className="text-red-700">{d.suggestion}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
