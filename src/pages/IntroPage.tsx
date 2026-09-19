import { motion } from "framer-motion";
import { Camera, Leaf, Sparkles } from "lucide-react";
import { PlantOrbit } from "../components/PlantOrbit";
import { ProviderMarquee } from "../components/ProviderMarquee";
import { DiagnosisCard } from "../components/DiagnosisCard";
import { LandingNav } from "../components/landing/LandingNav";
import { FeatureGrid } from "../components/landing/FeatureGrid";
import { Differentiators } from "../components/landing/Differentiators";
import { CommunityPreview } from "../components/landing/CommunityPreview";
import { LandingFooter } from "../components/landing/LandingFooter";
import { useMode } from "../lib/mode";
import type { Diagnosis } from "../lib/types";

const reveal = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const pipeline = [
  {
    icon: Camera,
    title: "Snap a photo",
    description: "Any plant or crop, any angle, from your phone or a webcam.",
  },
  {
    icon: Sparkles,
    title: "Get a diagnosis",
    description: "Pest damage, disease, nutrient gaps, or water stress, explained plainly.",
  },
  {
    icon: Leaf,
    title: "Apply a low-cost fix",
    description: "Compost, neem oil, watering changes. Nothing branded or expensive.",
  },
];

const EXAMPLE_DIAGNOSIS: Diagnosis = {
  plantName: "Tomato plant",
  scientificName: "Solanum lycopersicum",
  identificationConfidence: "high",
  category: "nutrient_deficiency",
  summary:
    "Older leaves are yellowing between the veins while staying green along them, a pattern often associated with a nutrient issue.",
  fix: "Dissolve a tablespoon of Epsom salt in a liter of water and apply at the base every two weeks until new growth looks healthy.",
  confidence: "high",
  healthStatus: "needs_attention",
  severityScore: 4,
  possibleCauses: [
    "Likely magnesium deficiency, given the vein pattern",
    "Possible general nutrient stress from compacted soil",
  ],
  recommendedActions: [
    "Apply a diluted Epsom salt solution at the base",
    "Work compost into the topsoil around the plant",
    "Avoid watering the leaves directly for now",
  ],
  urgency: "medium",
  followUpDays: 3,
  limitations: "A photo alone can't rule out a second, less visible cause. Recheck in a few days.",
  companionTip: "Plant basil or marigolds beside it; both attract helpful insects and can deter some tomato pests.",
  nativeAlternative: "Add borage nearby. Bees love it, and it is a traditional companion for tomatoes.",
  careProfile: {
    light: "full_sun",
    waterEveryDays: 2,
    minTempC: 10,
    maxTempC: 32,
    frostSensitive: true,
    source: "reference",
  },
  careTasks: [],
};

export function IntroPage() {
  const { chooseMode } = useMode();

  return (
    <div className="min-h-svh bg-page">
      <LandingNav />

      <PlantOrbit />

      <motion.p
        className="mx-auto mt-2 text-center text-xs font-semibold uppercase tracking-widest text-neutral-400"
        variants={reveal}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        No signup required to try it
      </motion.p>

      <motion.h1
        className="mx-auto mt-3 max-w-lg px-4 text-center text-3xl font-semibold tracking-tight text-black sm:text-4xl"
        variants={reveal}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        Point a camera at any plant. Get a diagnosis in seconds.
      </motion.h1>

      <motion.p
        className="mx-auto mt-3 max-w-md px-4 text-center text-sm text-neutral-500"
        variants={reveal}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.6, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
      >
        Choose how you want to use it.
      </motion.p>

      <div id="get-started" className="mx-auto mt-8 grid max-w-2xl scroll-mt-20 gap-4 px-4 sm:grid-cols-2">
        <motion.button
          type="button"
          onClick={() => chooseMode("demo")}
          variants={reveal}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.5, delay: 1.15, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
          className="rounded-2xl border border-neutral-300 bg-white p-6 text-left shadow-sm transition-colors hover:border-black"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Instant experience
          </span>
          <h2 className="mt-1 text-xl font-semibold text-black">Try Planet-i-Green</h2>
          <p className="mt-2 text-sm text-neutral-600">
            No account required. Take a photo of a plant and get an AI-powered health
            analysis, practical advice, and a recommended next step. Your session stays
            private and is not saved to a Planet-i-Green account.
          </p>
          <p className="mt-3 text-xs text-neutral-400">
            Perfect for a quick plant check, home gardeners, curious visitors, and
            anyone who just wants an answer.
          </p>
          <span className="mt-4 inline-block rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-medium text-black">
            Start checking a plant
          </span>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => chooseMode("full")}
          variants={reveal}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.5, delay: 1.25, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
          className="rounded-2xl border border-black bg-black p-6 text-left text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Full experience
          </span>
          <h2 className="mt-1 text-xl font-semibold">Grow with Planet-i-Green</h2>
          <p className="mt-2 text-sm text-neutral-300">
            Keep your plant history, track growth, manage care tasks, monitor
            treatments, explore community plant health, and build a long-term record
            for your plants.
          </p>
          <p className="mt-3 text-xs text-neutral-400">
            Designed for gardeners, growers, farmers, and anyone managing multiple
            plants over time.
          </p>
          <span className="mt-4 inline-block rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black">
            Create my garden
          </span>
        </motion.button>
      </div>

      <motion.p
        className="mx-auto mt-8 max-w-md px-4 text-center text-xs text-neutral-400"
        variants={reveal}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.5, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
      >
        You can switch between the two at any time.
      </motion.p>

      <motion.div
        className="mx-auto mt-14 flex max-w-md flex-col items-center gap-3 px-4"
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Example result
        </p>
        <DiagnosisCard diagnosis={EXAMPLE_DIAGNOSIS} />
      </motion.div>

      <section id="how-it-works" className="mx-auto mt-24 max-w-2xl scroll-mt-16 px-4">
        <motion.h2
          className="text-center text-2xl font-semibold tracking-tight text-black sm:text-3xl"
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Three steps, no expertise needed
        </motion.h2>

        <motion.div
          className="mt-10 flex items-start justify-center gap-8 sm:gap-12"
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {pipeline.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex max-w-[9rem] flex-col items-center gap-2 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-black">
                <Icon size={17} strokeWidth={1.8} />
              </span>
              <span className="text-sm font-medium text-black">{title}</span>
              <span className="text-xs text-neutral-500">{description}</span>
            </div>
          ))}
        </motion.div>
      </section>

      <FeatureGrid />
      <CommunityPreview />
      <Differentiators />

      <motion.div
        className="mx-auto mt-24 max-w-lg px-4 text-center"
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Works with
        </p>
        <ProviderMarquee />
      </motion.div>

      <motion.section
        className="mx-auto mt-24 max-w-lg px-4 text-center"
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">
          Ready to check on your plants?
        </h2>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => chooseMode("demo")}
            className="w-full rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-medium text-black transition-colors hover:border-black sm:w-auto"
          >
            Try the demo
          </button>
          <button
            type="button"
            onClick={() => chooseMode("full")}
            className="w-full rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
          >
            Use the full platform
          </button>
        </div>
      </motion.section>

      <LandingFooter />
    </div>
  );
}
