import Dexie, { type Table } from "dexie";
import type { CareCalendarEntry, DemoPlant, PlantReport } from "./types";
import type { BlurredPoint } from "./geo";

/** A scan taken while offline, with everything needed to diagnose and save it faithfully
 * once the connection is back (not just the photos). */
interface QueuedUpload {
  id: string;
  photoBlobs: Blob[];
  createdAt: number;
  /** Already blurred; the exact position is never stored. */
  location?: BlurredPoint;
  plantId?: string;
  /** Create a garden plant for this scan when no existing plant was chosen. */
  addToGarden?: boolean;
  plantNameInput?: string;
  environment?: "indoor" | "outdoor";
  weatherContext?: string;
  userNotes?: string;
}

export interface GreenActionLogEntry {
  id: string;
  actionId: string;
  doneAt: number;
}

class PlanetDB extends Dexie {
  reports!: Table<PlantReport, string>;
  careEntries!: Table<CareCalendarEntry, string>;
  uploadQueue!: Table<QueuedUpload, string>;
  demoPlants!: Table<DemoPlant, string>;
  actionLog!: Table<GreenActionLogEntry, string>;

  constructor() {
    super("planet");
    this.version(1).stores({
      reports: "id, createdAt, synced",
      careEntries: "id, plantReportId, dueAt, done",
      uploadQueue: "id, createdAt",
    });
    this.version(2).stores({
      demoPlants: "id, createdAt",
    });
    this.version(3).stores({
      careEntries: "id, plantReportId, plantId, dueAt, done",
      actionLog: "id, actionId, doneAt",
    });
  }
}

export const db = new PlanetDB();
export type { QueuedUpload };
