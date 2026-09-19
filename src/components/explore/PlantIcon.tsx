import { Carrot, Cherry, Clover, Flower2, Leaf, Sprout, type LucideIcon } from "lucide-react";
import type { PlantKind } from "../../lib/plantCatalog";

const ICONS: Record<PlantKind, LucideIcon> = {
  herb: Leaf,
  vegetable: Carrot,
  fruit: Cherry,
  flower: Flower2,
  houseplant: Sprout,
  succulent: Sprout,
  groundcover: Clover,
};

/** A plain icon tile per kind of plant. */
export function PlantIcon({ kind, size = "md" }: { kind: PlantKind; size?: "md" | "lg" }) {
  const Icon = ICONS[kind];
  const box = size === "lg" ? "size-14 rounded-2xl" : "size-11 rounded-xl";
  return (
    <span className={`flex shrink-0 items-center justify-center bg-green-100 text-green-700 ${box}`} aria-hidden>
      <Icon size={size === "lg" ? 28 : 22} strokeWidth={1.8} />
    </span>
  );
}
