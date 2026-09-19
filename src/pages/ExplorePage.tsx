import { useSearchParams } from "react-router-dom";
import { GreenActions } from "../components/explore/GreenActions";
import { PlantGuide } from "../components/explore/PlantGuide";

type Tab = "guide" | "actions";

/** A plant guide and green actions. The tab lives in the URL so back/forward behave. */
export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "actions" ? "actions" : "guide";

  const select = (next: Tab) => setParams(next === "guide" ? {} : { tab: next }, { replace: true });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-10">
      <h1 className="mb-4 text-2xl font-semibold text-black">Explore</h1>

      <div className="mb-4 flex gap-1 rounded-xl bg-neutral-100 p-1" role="tablist" aria-label="Explore sections">
        {(
          [
            { value: "guide", label: "Plants" },
            { value: "actions", label: "Green actions" },
          ] as const
        ).map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => select(item.value)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === item.value ? "bg-white text-black shadow-sm" : "text-neutral-500 hover:text-black"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "guide" ? <PlantGuide /> : <GreenActions />}
    </div>
  );
}
