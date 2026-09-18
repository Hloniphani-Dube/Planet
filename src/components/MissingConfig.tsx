import { useMode } from "../lib/mode";

export function MissingConfig() {
  const { chooseMode, resetMode } = useMode();

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold text-black">The full platform isn't set up yet</h1>
      <p className="text-sm text-neutral-600">
        It needs a Supabase project to save reports, run the community feed, and store
        API keys server-side. Copy{" "}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5">.env.example</code> to{" "}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5">.env</code> and fill in{" "}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5">VITE_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5">VITE_SUPABASE_ANON_KEY</code>,
        then restart the dev server.
      </p>
      <p className="text-sm text-neutral-600">
        See <code className="rounded bg-neutral-100 px-1.5 py-0.5">SUPABASE_SETUP.md</code> in
        the repo for the full walkthrough.
      </p>

      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={() => chooseMode("demo")}
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Try the easy demo instead
        </button>
        <button
          type="button"
          onClick={resetMode}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:border-black hover:text-black"
        >
          Back
        </button>
      </div>
    </div>
  );
}
