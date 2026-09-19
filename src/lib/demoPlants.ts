import { db as localDb } from "./db";
import { normalizeDiagnosis } from "./diagnosis";
import type { DemoPlant, Diagnosis } from "./types";

/** Everything here is local to this browser/session only. Nothing is sent to Supabase,
 * which is the whole point of the demo's privacy boundary. */

/** Observations saved by an earlier version of the app lack the newer diagnosis fields. */
function upgrade(plant: DemoPlant): DemoPlant {
  return {
    ...plant,
    observations: plant.observations.map((o) => ({ ...o, diagnosis: normalizeDiagnosis(o.diagnosis) })),
  };
}

export async function listDemoPlants(): Promise<DemoPlant[]> {
  const plants = await localDb.demoPlants.orderBy("createdAt").reverse().toArray();
  return plants.map(upgrade);
}

export async function getDemoPlant(id: string): Promise<DemoPlant | undefined> {
  const plant = await localDb.demoPlants.get(id);
  return plant ? upgrade(plant) : undefined;
}

export async function createDemoPlant(name: string, diagnosis: Diagnosis): Promise<DemoPlant> {
  const plant: DemoPlant = {
    id: crypto.randomUUID(),
    name,
    healthStatus: diagnosis.healthStatus,
    observations: [{ id: crypto.randomUUID(), diagnosis, createdAt: Date.now() }],
    createdAt: Date.now(),
  };
  await localDb.demoPlants.add(plant);
  return plant;
}

export async function addDemoObservation(plantId: string, diagnosis: Diagnosis): Promise<void> {
  const plant = await localDb.demoPlants.get(plantId);
  if (!plant) return;
  plant.observations = [
    { id: crypto.randomUUID(), diagnosis, createdAt: Date.now() },
    ...plant.observations,
  ];
  plant.healthStatus = diagnosis.healthStatus;
  await localDb.demoPlants.put(plant);
}
