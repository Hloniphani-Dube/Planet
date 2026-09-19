import { motion } from "framer-motion";

const reveal = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const MOCK_REPORTS = [
  { plant: "Basil", category: "pest damage", helpful: 6, resolved: true },
  { plant: "Monstera", category: "water stress", helpful: 3, resolved: false },
];

export function CommunityPreview() {
  return (
    <section id="community" className="mx-auto mt-24 max-w-2xl px-4">
      <motion.div
        className="text-center"
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Example activity
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-black sm:text-3xl">
          See what's going around nearby
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
          Reports appear as pins on a map, grouped by issue type. Tap one for a preview, react
          "helpful," and mark your own reports solved once the fix works.
        </p>
      </motion.div>

      <motion.ul
        className="mt-8 flex flex-col gap-3"
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {MOCK_REPORTS.map((report) => (
          <li
            key={report.plant}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-black">{report.plant}</span>
                {report.resolved && (
                  <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold text-white">
                    Solved
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500">{report.category}</p>
            </div>
            <span className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600">
              Helpful ({report.helpful})
            </span>
          </li>
        ))}
      </motion.ul>
    </section>
  );
}
