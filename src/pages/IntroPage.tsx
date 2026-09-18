import { motion } from "framer-motion";
import { PlantOrbit } from "../components/PlantOrbit";
import { useMode } from "../lib/mode";

const reveal = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function IntroPage() {
  const { chooseMode } = useMode();

  return (
    <div className="min-h-svh bg-white pb-16">
      <PlantOrbit />

      <motion.h1
        className="mx-auto mt-2 max-w-lg px-4 text-center text-3xl font-semibold tracking-tight text-black sm:text-4xl"
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

      <div className="mx-auto mt-8 grid max-w-2xl gap-4 px-4 sm:grid-cols-2">
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
            Easy demo
          </span>
          <h2 className="mt-1 text-xl font-semibold text-black">Try it now</h2>
          <p className="mt-2 text-sm text-neutral-600">
            No account, no backend, nothing saved. Bring your own Claude, OpenAI, or
            Gemini API key and it's used directly from your browser, then forgotten.
          </p>
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
            Full platform
          </span>
          <h2 className="mt-1 text-xl font-semibold">Save your history</h2>
          <p className="mt-2 text-sm text-neutral-300">
            Diagnoses are saved to a growth timeline, a care calendar, and a shared
            community feed. Uses an anonymous account behind the scenes, no email or
            password.
          </p>
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
    </div>
  );
}
