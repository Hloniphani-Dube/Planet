import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** A bottom sheet on phones and a dropdown card on larger screens. */
export function Sheet({ open, onClose, title, children }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  // Callers usually pass an inline function; keep the latest without re-running the effect.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  // Rendered into <body>: an ancestor with backdrop-filter (the sticky header) would
  // otherwise become the containing block for this fixed overlay and trap it.
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-[rgba(0,0,0,0.5)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="pb-safe absolute inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto rounded-t-3xl border border-neutral-200 bg-white p-5 shadow-2xl md:inset-x-auto md:bottom-auto md:right-4 md:top-16 md:w-80 md:rounded-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-black">{title}</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
