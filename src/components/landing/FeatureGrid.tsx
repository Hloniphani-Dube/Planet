import { motion } from "framer-motion";
import {
  CalendarClock,
  CloudSun,
  Compass,
  Download,
  Flower2,
  LineChart,
  Map as MapIcon,
  Share2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "AI diagnosis",
    description:
      "Vision AI identifies the plant, scores how serious the problem is, and explains the fix in plain language.",
  },
  {
    icon: CalendarClock,
    title: "Reminders that build themselves",
    description:
      "Each diagnosis becomes real tasks with due dates and a link back to the photo. Follow-ups chain automatically.",
  },
  {
    icon: LineChart,
    title: "Growth you can see",
    description: "Severity plotted over time, so \"is it recovering?\" is answered at a glance.",
  },
  {
    icon: CloudSun,
    title: "Weather-aware alerts",
    description:
      "Frost, heat and heavy-rain warnings, only for the plants that are actually affected. No API key needed.",
  },
  {
    icon: MapIcon,
    title: "A community map",
    description:
      "See what nearby gardeners are dealing with. Locations are blurred to a grid square before they are saved.",
  },
  {
    icon: Flower2,
    title: "Companion planting",
    description: "Every scan suggests good neighbours and a pollinator-friendly plant to add.",
  },
  {
    icon: Compass,
    title: "Plant guide and green actions",
    description: "Find the right plant for your space, then do things with plants that help the planet.",
  },
  {
    icon: Share2,
    title: "Shareable cards",
    description: "Turn any diagnosis into a clean image to send to a friend or post to the community.",
  },
  {
    icon: Download,
    title: "Install it like an app",
    description: "Add it to your home screen. It works offline and queues photos until you are back online.",
  },
];

const reveal = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto mt-24 max-w-4xl px-4">
      <motion.div
        className="text-center"
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Everything in one place
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-black sm:text-3xl">
          One photo in, a full care system out
        </h2>
      </motion.div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }, i) => (
          <motion.div
            key={title}
            className="rounded-2xl border border-neutral-200 p-5"
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-black">
              <Icon size={18} strokeWidth={1.8} />
            </span>
            <h3 className="mt-3 text-sm font-semibold text-black">{title}</h3>
            <p className="mt-1 text-xs text-neutral-500">{description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
