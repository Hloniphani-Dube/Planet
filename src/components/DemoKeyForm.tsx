import { useState } from "react";
import {
  CLIENT_PROVIDER_IDS,
  CLIENT_PROVIDERS,
  testApiKeyInBrowser,
} from "../lib/clientDiagnose";
import { STOCK_IMAGES } from "../lib/images";
import type { AiProvider } from "../lib/types";

type KeyTestStatus = "idle" | "testing" | "valid" | "invalid";

interface Props {
  provider: AiProvider;
  onProviderChange: (provider: AiProvider) => void;
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
  onStart: () => void;
}

/** The demo's "bring your own key" screen. The key lives in memory only. */
export function DemoKeyForm({ provider, onProviderChange, apiKey, onApiKeyChange, onStart }: Props) {
  const [status, setStatus] = useState<KeyTestStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  function reset() {
    setStatus("idle");
    setMessage(null);
  }

  async function handleTest() {
    setStatus("testing");
    setMessage(null);
    try {
      await testApiKeyInBrowser(provider, apiKey);
      setStatus("valid");
    } catch (err) {
      setStatus("invalid");
      setMessage(err instanceof Error ? err.message : "That key was rejected.");
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-8 text-center">
      <img
        src={STOCK_IMAGES.diagnoseHero}
        alt=""
        className="grayscale-photo h-32 w-full rounded-2xl object-cover"
      />
      <h1 className="text-xl font-semibold text-black">Bring your own API key</h1>
      <p className="text-sm text-neutral-500">
        The demo runs entirely in your browser. Your key is used to call the AI provider directly and
        isn't sent anywhere else or saved. It's cleared the moment you refresh this page.
      </p>

      <div className="flex w-full flex-col gap-3 rounded-2xl border border-neutral-200 p-4 text-left">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Provider</span>
        <div className="flex gap-2">
          {CLIENT_PROVIDER_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onProviderChange(id);
                reset();
              }}
              className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                provider === id
                  ? "border-black bg-black text-white"
                  : "border-neutral-300 text-neutral-600 hover:border-black"
              }`}
            >
              {CLIENT_PROVIDERS[id].label}
            </button>
          ))}
        </div>

        <label className="mt-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
          API key
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              onApiKeyChange(e.target.value);
              reset();
            }}
            placeholder="Paste your key"
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-normal normal-case text-black"
          />
        </label>
        <a
          href={CLIENT_PROVIDERS[provider].helpUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-neutral-500 underline"
        >
          Get a key at {CLIENT_PROVIDERS[provider].helpText}
        </a>

        <div className="mt-1 flex gap-2">
          <button
            type="button"
            disabled={apiKey.trim().length < 10 || status === "testing"}
            onClick={handleTest}
            className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-black hover:text-black disabled:opacity-50"
          >
            {status === "testing" ? "Testing." : "Test key"}
          </button>
          <button
            type="button"
            disabled={apiKey.trim().length < 10}
            onClick={onStart}
            className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Start diagnosing
          </button>
        </div>

        {status === "valid" && <p className="text-xs font-medium text-green-700">Key looks valid.</p>}
        {status === "invalid" && <p className="text-xs font-medium text-red-600">{message}</p>}
      </div>
    </div>
  );
}
