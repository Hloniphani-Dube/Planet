import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { shareDiagnosis } from "../lib/shareCard";
import type { Diagnosis } from "../lib/types";

interface Props {
  diagnosis: Diagnosis;
  /** The scan photo (local blob or public URL) to put on the card. */
  photo?: Blob | string;
  /** A public page for this report, when there is one. */
  url?: string;
  className?: string;
}

/** Turns a diagnosis into a shareable image: the native share sheet where available,
 * otherwise a PNG download. */
export function ShareButton({ diagnosis, photo, url, className = "" }: Props) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleShare() {
    setState("busy");
    try {
      const outcome = await shareDiagnosis(diagnosis, photo, url);
      if (outcome === "cancelled") {
        setState("idle");
        return;
      }
      setMessage(outcome === "shared" ? "Shared" : "Image saved");
      setState("done");
      setTimeout(() => setState("idle"), 2500);
    } catch (err) {
      console.error(err);
      setState("error");
    }
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleShare}
        disabled={state === "busy"}
        className={`inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-black hover:text-black disabled:opacity-60 ${className}`}
      >
        {state === "done" ? <Check size={14} aria-hidden /> : <Share2 size={14} aria-hidden />}
        {state === "busy" ? "Preparing." : state === "done" ? message : "Share"}
      </button>
      {state === "error" && (
        <span className="mt-1 text-[11px] text-red-600">Couldn't create the image. Try again.</span>
      )}
    </span>
  );
}
