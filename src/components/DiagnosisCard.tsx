import { Link } from "react-router-dom";
import { CalendarPlus, Check, Flower2, Sprout } from "lucide-react";
import type { Diagnosis } from "../lib/types";
import { healthDotColor, healthLabels } from "../lib/health";
import { CareProfileChips } from "./CareProfileView";
import { SeverityMeter } from "./SeverityChart";
import { ShareButton } from "./ShareButton";

const categoryLabels: Record<Diagnosis["category"], string> = {
  nutrient_deficiency: "Nutrient deficiency",
  pest_damage: "Pest damage",
  disease: "Disease",
  water_stress: "Water stress",
  healthy: "Healthy",
  unknown: "Needs a clearer photo",
};

function pad(n: number): string {
  return String(n + 1).padStart(2, "0");
}

interface Props {
  diagnosis: Diagnosis;
  /** The scan photo, used to build the shareable image. Omit to hide the share button. */
  photo?: Blob | string;
  /** A public page for this report, included when sharing. */
  shareUrl?: string;
  /** Demo / manual mode: a button that turns the follow-up into a calendar file. */
  onSetFollowUp?: () => void;
  followUpSet?: boolean;
  followUpLabel?: string;
  /** Full mode: how many reminders were created from this diagnosis automatically. */
  remindersAdded?: number;
}

export function DiagnosisCard({
  diagnosis,
  photo,
  shareUrl,
  onSetFollowUp,
  followUpSet,
  followUpLabel = "Set follow-up",
  remindersAdded,
}: Props) {
  const hasSharing = diagnosis.companionTip || diagnosis.nativeAlternative;

  return (
    <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Plant health
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
          <span className={`h-2 w-2 rounded-full ${healthDotColor[diagnosis.healthStatus]}`} aria-hidden />
          {healthLabels[diagnosis.healthStatus]}
        </span>
      </div>

      <h2 className="text-lg font-semibold text-black">{diagnosis.plantName}</h2>
      {diagnosis.scientificName && (
        <p className="text-xs italic text-neutral-500">
          {diagnosis.scientificName}
          <span className="not-italic text-neutral-400">
            {" "}
            · identified with {diagnosis.identificationConfidence} confidence
          </span>
        </p>
      )}
      <p className="mb-3 mt-0.5 text-xs text-neutral-400">
        {categoryLabels[diagnosis.category]} · {diagnosis.confidence} confidence in the diagnosis
      </p>

      <SeverityMeter score={diagnosis.severityScore} />

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        What Planet-i-Green sees
      </p>
      <p className="mt-1 text-sm text-neutral-700">{diagnosis.summary}</p>

      {diagnosis.possibleCauses.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Possible causes
          </p>
          <ol className="mt-1.5 flex flex-col gap-1">
            {diagnosis.possibleCauses.map((cause, i) => (
              <li key={i} className="flex gap-2 text-sm text-neutral-700">
                <span className="font-mono text-xs text-neutral-400">{pad(i)}</span>
                {cause}
              </li>
            ))}
          </ol>
        </div>
      )}

      {diagnosis.recommendedActions.length > 0 && (
        <div className="mt-4 rounded-xl bg-neutral-100 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            What to do now
          </p>
          <ol className="mt-1.5 flex flex-col gap-1">
            {diagnosis.recommendedActions.map((action, i) => (
              <li key={i} className="flex gap-2 text-sm text-neutral-800">
                <span className="font-mono text-xs text-neutral-400">{i + 1}.</span>
                {action}
              </li>
            ))}
          </ol>
        </div>
      )}

      {diagnosis.limitations && (
        <p className="mt-3 text-xs text-neutral-400">{diagnosis.limitations}</p>
      )}

      {hasSharing && (
        <div className="mt-4 flex flex-col gap-2">
          {diagnosis.companionTip && (
            <div className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
              <Sprout size={18} className="mt-0.5 shrink-0 text-green-700" aria-hidden />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Good neighbours</p>
                <p className="mt-0.5 text-sm text-neutral-800">{diagnosis.companionTip}</p>
              </div>
            </div>
          )}
          {diagnosis.nativeAlternative && (
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <Flower2 size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Bring in the pollinators
                </p>
                <p className="mt-0.5 text-sm text-neutral-800">{diagnosis.nativeAlternative}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">Care profile</p>
        <CareProfileChips profile={diagnosis.careProfile} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
        <span className="text-sm text-neutral-600">
          Check again in <span className="font-semibold text-black">{diagnosis.followUpDays} days</span>
        </span>
        <div className="flex items-center gap-2">
          {photo !== undefined && <ShareButton diagnosis={diagnosis} photo={photo} url={shareUrl} />}
          {onSetFollowUp && (
            <button
              type="button"
              onClick={onSetFollowUp}
              disabled={followUpSet}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-black hover:text-black disabled:opacity-60"
            >
              {followUpSet ? <Check size={14} aria-hidden /> : <CalendarPlus size={14} aria-hidden />}
              {followUpSet ? "Added" : followUpLabel}
            </button>
          )}
        </div>
      </div>

      {remindersAdded !== undefined && remindersAdded > 0 && (
        <Link
          to="/calendar"
          className="mt-3 flex items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
        >
          <Check size={14} className="text-green-700" aria-hidden />
          {remindersAdded} reminder{remindersAdded === 1 ? "" : "s"} added to your care calendar
        </Link>
      )}
    </div>
  );
}
