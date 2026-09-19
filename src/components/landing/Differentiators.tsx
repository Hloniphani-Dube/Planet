import { motion } from "framer-motion";
import { Code2, KeyRound, ShieldCheck, WifiOff, type LucideIcon } from "lucide-react";

interface Item {
  icon: LucideIcon;
  title: string;
  description: string;
}

const ITEMS: Item[] = [
  {
    icon: KeyRound,
    title: "No vendor lock-in",
    description: "Claude, OpenAI, or Gemini. Switch any time, keep your data either way.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    description: "The demo never creates an account or sends anything to a server. Community locations are blurred before they leave your device.",
  },
  {
    icon: WifiOff,
    title: "Built for low connectivity",
    description: "Install it as an app. Queued diagnoses and cached tips mean spotty signal isn't a dead end.",
  },
  {
    icon: Code2,
    title: "Open source",
    description: "MIT licensed. Read the code, self-host it, change how it works.",
  },
];

const reveal = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function Differentiators() {
  return (
    <section className="mx-auto mt-24 max-w-4xl px-4">
      <motion.h2
        className="text-center text-2xl font-semibold tracking-tight text-black sm:text-3xl"
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Why it's built this way
      </motion.h2>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        {ITEMS.map(({ icon: Icon, title, description }, i) => (
          <motion.div
            key={title}
            className="flex gap-4"
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-black">
              <Icon size={18} strokeWidth={1.8} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-black">{title}</h3>
              <p className="mt-1 text-xs text-neutral-500">{description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
