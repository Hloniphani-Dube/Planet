import { motion } from "framer-motion";

const PROVIDERS = ["Claude", "OpenAI", "Gemini"];
const LOOP = [...PROVIDERS, ...PROVIDERS, ...PROVIDERS];

export function ProviderMarquee() {
  return (
    <div className="relative mx-auto mt-5 w-full max-w-lg overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

      <motion.div
        className="flex w-max items-center gap-10"
        animate={{ x: ["0%", "-33.333%"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      >
        {LOOP.map((name, i) => (
          <span
            key={i}
            className="whitespace-nowrap text-sm font-semibold uppercase tracking-widest text-neutral-400"
          >
            {name}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
