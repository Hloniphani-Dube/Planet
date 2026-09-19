import { ThemeToggle } from "../ThemeToggle";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white/92 px-4 py-3 backdrop-blur sm:px-6">
      <span className="text-lg font-semibold tracking-tight text-black">Planet-i-Green</span>
      <nav className="hidden items-center gap-6 text-sm text-neutral-500 sm:flex">
        <a href="#features" className="transition-colors hover:text-black">
          Features
        </a>
        <a href="#how-it-works" className="transition-colors hover:text-black">
          How it works
        </a>
        <a href="#community" className="transition-colors hover:text-black">
          Community
        </a>
      </nav>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <a
          href="#get-started"
          className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Get started
        </a>
      </div>
    </header>
  );
}
