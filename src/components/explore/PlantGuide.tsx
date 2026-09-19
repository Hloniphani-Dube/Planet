import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { CATALOG, type BenefitTag, type CatalogPlant, type Place } from "../../lib/plantCatalog";
import type { LightNeed } from "../../lib/types";
import { Sheet } from "../Sheet";
import { PlantIcon } from "./PlantIcon";

interface Filters {
  place: Place | null;
  /** The light the spot gets. Plants that need more than this are left out. */
  light: LightNeed | null;
  benefit: BenefitTag | null;
  easyOnly: boolean;
}

const NO_FILTERS: Filters = { place: null, light: null, benefit: null, easyOnly: false };

const LIGHT_RANK: Record<LightNeed, number> = { low: 0, medium: 1, bright: 2, full_sun: 3 };

const PLACE_OPTIONS: { value: Place; label: string }[] = [
  { value: "indoor", label: "Indoors" },
  { value: "outdoor", label: "Outdoors" },
];

const LIGHT_OPTIONS: { value: LightNeed; label: string }[] = [
  { value: "low", label: "Dim" },
  { value: "medium", label: "Some light" },
  { value: "bright", label: "Bright" },
  { value: "full_sun", label: "Sunny" },
];

const BENEFIT_OPTIONS: { value: BenefitTag; label: string }[] = [
  { value: "edible", label: "Edible" },
  { value: "pollinators", label: "Pollinators" },
  { value: "water_wise", label: "Low water" },
  { value: "soil_health", label: "Builds soil" },
  { value: "pest_control", label: "Pest control" },
];

function matches(plant: CatalogPlant, filters: Filters, query: string): boolean {
  if (filters.place && !plant.places.includes(filters.place)) return false;
  if (filters.light && LIGHT_RANK[plant.care.light] > LIGHT_RANK[filters.light]) return false;
  if (filters.benefit && !plant.benefits.includes(filters.benefit)) return false;
  if (filters.easyOnly && plant.difficulty !== "easy") return false;
  if (!query) return true;
  return (
    plant.name.toLowerCase().includes(query) ||
    plant.scientificName.toLowerCase().includes(query) ||
    plant.aliases.some((alias) => alias.includes(query))
  );
}

function countActive(filters: Filters): number {
  return [filters.place, filters.light, filters.benefit].filter(Boolean).length + (filters.easyOnly ? 1 : 0);
}

export function PlantCard({ plant }: { plant: CatalogPlant }) {
  return (
    <Link
      to={`/explore/plants/${plant.slug}`}
      className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 transition-colors hover:border-black"
    >
      <PlantIcon kind={plant.kind} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-black">{plant.name}</span>
        <span className="block truncate text-xs italic text-neutral-500">{plant.scientificName}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-neutral-300" aria-hidden />
    </Link>
  );
}

function Option<T extends string>({
  value,
  current,
  label,
  onSelect,
}: {
  value: T;
  current: T | null;
  label: string;
  onSelect: (value: T | null) => void;
}) {
  const on = current === value;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onSelect(on ? null : value)}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        on ? "border-black bg-black text-white" : "border-neutral-300 text-neutral-700 hover:border-black"
      }`}
    >
      {label}
    </button>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function PlantGuide() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [open, setOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const plants = useMemo(() => CATALOG.filter((plant) => matches(plant, filters, q)), [filters, q]);
  const active = countActive(filters);

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plants"
            aria-label="Search plants"
            className="w-full rounded-xl border border-neutral-300 bg-white py-2.5 pl-9 pr-3 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={active > 0 ? `Filters, ${active} active` : "Filters"}
          className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-neutral-300 text-neutral-700 transition-colors hover:border-black"
        >
          <SlidersHorizontal size={18} aria-hidden />
          {active > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-green-700 text-[11px] font-semibold text-white">
              {active}
            </span>
          )}
        </button>
      </div>

      {plants.length === 0 ? (
        <p className="mt-8 text-center text-sm text-neutral-500">
          No matches.{" "}
          {active > 0 && (
            <button type="button" onClick={() => setFilters(NO_FILTERS)} className="font-medium text-black underline">
              Clear filters
            </button>
          )}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {plants.map((plant) => (
            <li key={plant.slug}>
              <PlantCard plant={plant} />
            </li>
          ))}
        </ul>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Filter plants">
        <FilterGroup title="Where">
          {PLACE_OPTIONS.map((o) => (
            <Option key={o.value} {...o} current={filters.place} onSelect={(place) => setFilters({ ...filters, place })} />
          ))}
        </FilterGroup>
        <FilterGroup title="Light">
          {LIGHT_OPTIONS.map((o) => (
            <Option key={o.value} {...o} current={filters.light} onSelect={(light) => setFilters({ ...filters, light })} />
          ))}
        </FilterGroup>
        <FilterGroup title="Good for">
          {BENEFIT_OPTIONS.map((o) => (
            <Option key={o.value} {...o} current={filters.benefit} onSelect={(benefit) => setFilters({ ...filters, benefit })} />
          ))}
        </FilterGroup>
        <FilterGroup title="Effort">
          <Option
            value="easy"
            current={filters.easyOnly ? "easy" : null}
            label="Easy only"
            onSelect={(v) => setFilters({ ...filters, easyOnly: v === "easy" })}
          />
        </FilterGroup>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilters(NO_FILTERS)}
            disabled={active === 0}
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 disabled:opacity-40"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white"
          >
            Show {plants.length} plant{plants.length === 1 ? "" : "s"}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
