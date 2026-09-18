import type { Diagnosis } from "../lib/types";

const categoryLabels: Record<Diagnosis["category"], string> = {
  nutrient_deficiency: "Nutrient deficiency",
  pest_damage: "Pest damage",
  disease: "Disease",
  water_stress: "Water stress",
  healthy: "Healthy",
  unknown: "Needs a clearer photo",
};

export function DiagnosisCard({ diagnosis }: { diagnosis: Diagnosis }) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-black">
        {categoryLabels[diagnosis.category]} · {diagnosis.confidence} confidence
      </div>
      <h2 className="mb-2 text-lg font-semibold text-black">{diagnosis.plantName}</h2>
      <p className="mb-3 text-sm text-neutral-700">{diagnosis.summary}</p>
      <div className="rounded-xl bg-neutral-100 p-3 text-sm text-neutral-800">
        <span className="font-semibold">Try this: </span>
        {diagnosis.fix}
      </div>
    </div>
  );
}
