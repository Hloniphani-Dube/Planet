import Dexie, { type Table } from "dexie";
import type { CareCalendarEntry, PlantReport } from "./types";

interface QueuedUpload {
  id: string;
  photoBlobs: Blob[];
  createdAt: number;
  lat?: number;
  lng?: number;
}

class PlanetDB extends Dexie {
  reports!: Table<PlantReport, string>;
  careEntries!: Table<CareCalendarEntry, string>;
  uploadQueue!: Table<QueuedUpload, string>;

  constructor() {
    super("planet");
    this.version(1).stores({
      reports: "id, createdAt, synced",
      careEntries: "id, plantReportId, dueAt, done",
      uploadQueue: "id, createdAt",
    });
  }
}

export const db = new PlanetDB();
export type { QueuedUpload };
