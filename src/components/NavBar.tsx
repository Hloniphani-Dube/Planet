import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Diagnose", end: true },
  { to: "/calendar", label: "Calendar" },
  { to: "/community", label: "Community" },
  { to: "/growth", label: "Growth" },
  { to: "/settings", label: "Settings" },
];

export function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-neutral-200 bg-white py-2 shadow-[0_-1px_6px_rgba(0,0,0,0.06)] sm:static sm:justify-start sm:gap-6 sm:border-none sm:bg-transparent sm:px-6 sm:py-4 sm:shadow-none">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            `text-sm font-medium ${
              isActive ? "text-black underline underline-offset-4" : "text-neutral-500 hover:text-black"
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
