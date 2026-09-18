import { useEffect, useState } from "react";
import { db as localDb } from "../lib/db";
import { STOCK_IMAGES } from "../lib/images";
import type { PlantReport } from "../lib/types";

export function GrowthPage() {
  const [reports, setReports] = useState<PlantReport[]>([]);

  useEffect(() => {
    void localDb.reports
      .orderBy("createdAt")
      .toArray()
      .then(setReports);
  }, []);

  const byPlant = reports.reduce<Record<string, PlantReport[]>>((acc, report) => {
    const key = report.diagnosis.plantName;
    (acc[key] ??= []).push(report);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <img
        src={STOCK_IMAGES.growth}
        alt=""
        className="grayscale-photo mb-6 h-32 w-full rounded-2xl object-cover"
      />

      <h1 className="mb-1 text-2xl font-semibold text-black">Growth tracking</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Repeat photos of the same plant, lined up over time.
      </p>

      {Object.keys(byPlant).length === 0 && (
        <p className="rounded-xl bg-neutral-100 p-4 text-sm text-neutral-700">
          Diagnose the same plant a few times to see its trend here.
        </p>
      )}

      {Object.entries(byPlant).map(([plantName, plantReports]) => (
        <div key={plantName} className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-black">{plantName}</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {plantReports.map((report) => (
              <div key={report.id} className="w-28 flex-shrink-0 text-center">
                {report.photoUrls[0] && (
                  <img
                    src={report.photoUrls[0]}
                    alt={plantName}
                    className="h-28 w-28 rounded-xl object-cover shadow-sm"
                  />
                )}
                <div className="mt-1 text-xs text-neutral-500">
                  {new Date(report.createdAt).toLocaleDateString()}
                  {report.photoUrls.length > 1 && ` (${report.photoUrls.length} photos)`}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
