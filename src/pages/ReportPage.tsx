import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DiagnosisCard } from "../components/DiagnosisCard";
import { getReport } from "../lib/reports";
import { supabase } from "../lib/supabase";
import { timeAgo } from "../lib/time";
import type { PlantReport } from "../lib/types";

/** A single report: the photo(s) and the full diagnosis, with a share button. Reports are
 * public, so this also works as the target of a shared link. */
export function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<PlantReport | null | undefined>(undefined);
  const [error, setError] = useState(false);
  const [isMine, setIsMine] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getReport(id)
      .then((result) => {
        if (cancelled) return;
        setReport(result);
        // Plant profiles are private, so only offer the link to the person who owns it.
        void supabase.auth.getSession().then(({ data }) => {
          if (!cancelled) setIsMine(Boolean(result) && data.session?.user.id === result?.userId);
        });
      })
      .catch((err) => {
        console.error("Failed to load report", err);
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center text-sm text-neutral-500">
        Couldn't load this report. Check your connection and try again.
      </div>
    );
  }

  if (report === undefined) {
    return <p className="px-4 py-10 text-center text-sm text-neutral-500">Loading.</p>;
  }

  if (report === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-sm text-neutral-500">This report couldn't be found. It may have been removed.</p>
        <Link to="/" className="mt-3 inline-block text-sm font-medium text-black underline">
          Back to Planet-i-Green
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6 pb-10">
      {report.photoUrls.length > 0 && (
        <div className={`grid gap-2 ${report.photoUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {report.photoUrls.map((url) => (
            <img
              key={url}
              src={url}
              alt={`${report.diagnosis.plantName} photo`}
              className="aspect-square w-full rounded-2xl object-cover"
            />
          ))}
        </div>
      )}

      <p className="text-xs text-neutral-400">
        Reported {timeAgo(report.createdAt)}
        {report.resolved && " · marked solved"}
        {report.helpfulCount > 0 && ` · ${report.helpfulCount} found this helpful`}
      </p>

      <DiagnosisCard
        diagnosis={report.diagnosis}
        photo={report.photoUrls[0] ?? ""}
        shareUrl={window.location.href}
      />

      {report.plantId && isMine && (
        <Link
          to={`/plants/${report.plantId}`}
          className="self-start rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-black hover:text-black"
        >
          Open this plant
        </Link>
      )}
    </div>
  );
}
