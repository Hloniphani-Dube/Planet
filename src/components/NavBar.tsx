import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarCheck, Camera, Compass, Sprout, Users, type LucideIcon } from "lucide-react";
import type { AppMode } from "../lib/mode";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Extra path prefixes that should also light this tab up. */
  matches?: string[];
  primary?: boolean;
}

const SCAN: NavItem = { to: "/", label: "Scan", icon: Camera, primary: true };
const GARDEN: NavItem = { to: "/plants", label: "Garden", icon: Sprout, matches: ["/plants", "/growth"] };
const CARE: NavItem = { to: "/calendar", label: "Care", icon: CalendarCheck };
const EXPLORE: NavItem = { to: "/explore", label: "Explore", icon: Compass, matches: ["/explore"] };
const COMMUNITY: NavItem = { to: "/community", label: "Community", icon: Users };

/** Bottom bar order puts Scan in the middle, where a thumb reaches it. */
export function bottomItems(mode: AppMode): NavItem[] {
  return mode === "full" ? [GARDEN, CARE, SCAN, EXPLORE, COMMUNITY] : [SCAN, EXPLORE];
}

function topItems(mode: AppMode): NavItem[] {
  return mode === "full" ? [SCAN, GARDEN, CARE, EXPLORE, COMMUNITY] : [SCAN, EXPLORE];
}

function useIsActive(item: NavItem): boolean {
  const { pathname } = useLocation();
  if (item.to === "/") return pathname === "/";
  return (item.matches ?? [item.to]).some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function BottomTab({ item, raised }: { item: NavItem; raised: boolean }) {
  const active = useIsActive(item);
  const Icon = item.icon;

  if (raised) {
    return (
      <NavLink
        to={item.to}
        end
        aria-label={item.label}
        className="relative flex flex-col items-center justify-end pb-1.5"
      >
        <span
          className={`-mt-6 flex size-14 items-center justify-center rounded-full bg-green-700 text-white shadow-lg ring-4 ring-white transition-transform active:scale-95 ${
            active ? "scale-105" : ""
          }`}
        >
          <Icon size={26} strokeWidth={2} aria-hidden />
        </span>
        <span className={`mt-0.5 text-[11px] font-medium ${active ? "text-green-700" : "text-neutral-500"}`}>
          {item.label}
        </span>
      </NavLink>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className="relative flex flex-col items-center justify-center gap-0.5 py-2"
    >
      <span className="relative flex h-7 w-14 items-center justify-center">
        {active && (
          <motion.span
            layoutId="bottom-nav-pill"
            className="absolute inset-0 rounded-full bg-green-100"
            transition={{ type: "spring", damping: 28, stiffness: 360 }}
          />
        )}
        <Icon
          size={22}
          strokeWidth={active ? 2.2 : 1.8}
          className={`relative ${active ? "text-green-700" : "text-neutral-500"}`}
          aria-hidden
        />
      </span>
      <span className={`text-[11px] font-medium ${active ? "text-green-700" : "text-neutral-500"}`}>
        {item.label}
      </span>
    </NavLink>
  );
}

/** Mobile bottom tab bar. Fixed to the bottom and safe-area aware. */
export function BottomNav({ mode }: { mode: AppMode }) {
  const items = bottomItems(mode);
  const raised = items.length >= 5;

  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/92 backdrop-blur md:hidden"
    >
      <div className={`mx-auto grid max-w-lg ${items.length >= 5 ? "grid-cols-5" : "grid-cols-2"}`}>
        {items.map((item) => (
          <BottomTab key={item.to} item={item} raised={raised && item.primary === true} />
        ))}
      </div>
    </nav>
  );
}

function TopLink({ item }: { item: NavItem }) {
  const active = useIsActive(item);
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-green-100 text-green-700" : "text-neutral-500 hover:bg-neutral-100 hover:text-black"
      }`}
    >
      <Icon size={16} strokeWidth={2} aria-hidden />
      {item.label}
    </NavLink>
  );
}

/** Inline navigation for tablets and desktops. */
export function TopNav({ mode }: { mode: AppMode }) {
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {topItems(mode).map((item) => (
        <TopLink key={item.to} item={item} />
      ))}
    </nav>
  );
}
