import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** A collapsed-by-default section, so a page shows the essentials first and the detail only
 * when asked for. */
export function Disclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-neutral-200 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-3.5 text-left text-sm font-medium text-black"
      >
        {title}
        <ChevronDown
          size={18}
          className={`text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && <div className="pb-4 text-sm text-neutral-600">{children}</div>}
    </div>
  );
}
