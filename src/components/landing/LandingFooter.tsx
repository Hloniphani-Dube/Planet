import { useMode } from "../../lib/mode";

export function LandingFooter() {
  const { chooseMode } = useMode();

  return (
    <footer className="mx-auto mt-24 max-w-4xl border-t border-neutral-200 px-4 py-10">
      <div className="grid gap-8 sm:grid-cols-3">
        <div>
          <span className="text-lg font-semibold tracking-tight text-black">Planet-i-Green</span>
          <p className="mt-2 text-xs text-neutral-500">Plant health, plainly explained.</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Product</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-neutral-500">
            <li>
              <a href="#features" className="transition-colors hover:text-black">
                Features
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="transition-colors hover:text-black">
                How it works
              </a>
            </li>
            <li>
              <a href="#community" className="transition-colors hover:text-black">
                Community
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Get started
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-neutral-500">
            <li>
              <button type="button" onClick={() => chooseMode("demo")} className="transition-colors hover:text-black">
                Try the demo
              </button>
            </li>
            <li>
              <button type="button" onClick={() => chooseMode("full")} className="transition-colors hover:text-black">
                Full platform
              </button>
            </li>
          </ul>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-neutral-400">Open source, MIT licensed.</p>
    </footer>
  );
}
