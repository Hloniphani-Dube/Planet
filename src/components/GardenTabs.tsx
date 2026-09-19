import { NavLink } from "react-router-dom";

/** Switches between the plant list and the growth trends, which live under one Garden tab. */
export function GardenTabs() {
  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium transition-colors ${
      isActive ? "bg-white text-black shadow-sm" : "text-neutral-500 hover:text-black"
    }`;

  return (
    <div className="mb-5 flex gap-1 rounded-xl bg-neutral-100 p-1" role="tablist" aria-label="Garden views">
      <NavLink to="/plants" className={tab} end>
        My plants
      </NavLink>
      <NavLink to="/growth" className={tab}>
        Growth trends
      </NavLink>
    </div>
  );
}
