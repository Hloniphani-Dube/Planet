import { useEffect, useState } from "react";
import { ensureAnonymousSession } from "../lib/supabase";
import {
  clearApiKey,
  getProviderStatus,
  saveApiKey,
  setActiveProvider,
  testApiKey,
} from "../lib/settings";
import { CLIENT_PROVIDERS } from "../lib/clientDiagnose";
import type { AiProvider, ProviderStatusRow } from "../lib/types";

type TestStatus = "idle" | "testing" | "valid" | "invalid";

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

export function SettingsPage() {
  const [rows, setRows] = useState<ProviderStatusRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testStatus, setTestStatus] = useState<Record<string, TestStatus>>({});
  const [testMessage, setTestMessage] = useState<Record<string, string>>({});

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      await ensureAnonymousSession();
      setRows(await getProviderStatus());
    } catch (err) {
      console.error(err);
      setError("Couldn't load provider status.");
    } finally {
      setLoading(false);
    }
  }

  function clearTestState(provider: AiProvider) {
    setTestStatus((s) => ({ ...s, [provider]: "idle" }));
    setTestMessage((m) => ({ ...m, [provider]: "" }));
  }

  async function handleTest(provider: AiProvider) {
    const apiKey = drafts[provider]?.trim();
    if (!apiKey) return;
    setTestStatus((s) => ({ ...s, [provider]: "testing" }));
    setTestMessage((m) => ({ ...m, [provider]: "" }));
    try {
      await testApiKey(provider, apiKey);
      setTestStatus((s) => ({ ...s, [provider]: "valid" }));
    } catch (err) {
      setTestStatus((s) => ({ ...s, [provider]: "invalid" }));
      setTestMessage((m) => ({ ...m, [provider]: errorMessage(err, "That key was rejected.") }));
    }
  }

  async function handleSave(provider: AiProvider) {
    const apiKey = drafts[provider]?.trim();
    if (!apiKey) return;
    setBusyId(provider);
    setError(null);
    try {
      await saveApiKey(provider, apiKey);
      setDrafts((d) => ({ ...d, [provider]: "" }));
      clearTestState(provider);
      await refresh();
    } catch (err) {
      console.error(err);
      setError(errorMessage(err, "Couldn't save that key."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleActivate(provider: AiProvider) {
    setBusyId(provider);
    setError(null);
    try {
      await setActiveProvider(provider);
      await refresh();
    } catch (err) {
      console.error(err);
      setError(errorMessage(err, "Couldn't activate that provider."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleClear(provider: AiProvider) {
    setBusyId(provider);
    setError(null);
    try {
      await clearApiKey(provider);
      await refresh();
    } catch (err) {
      console.error(err);
      setError(errorMessage(err, "Couldn't remove that key."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold text-black">AI provider</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Bring your own API key for any supported model. Whichever one is active is used for
        diagnosis. Switch anytime, no redeploy needed.
      </p>

      {loading && <p className="text-sm text-neutral-500">Loading.</p>}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <ul className="flex flex-col gap-4">
        {rows.map((row) => {
          const status = row.active ? "active" : row.hasKey ? "has-key" : "none";
          const dotColor =
            status === "active"
              ? "bg-green-500"
              : status === "has-key"
                ? "bg-yellow-400"
                : "bg-red-400";
          const statusLabel =
            status === "active"
              ? "Active, currently used for diagnosis"
              : status === "has-key"
                ? "Has API key, not active"
                : "No API key";
          const busy = busyId === row.id;
          const draftKey = drafts[row.id]?.trim() ?? "";
          const rowTestStatus = testStatus[row.id] ?? "idle";

          return (
            <li key={row.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-black">{row.label}</span>
                <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} aria-hidden />
                  {statusLabel}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder={row.hasKey ? "Replace key." : "Paste API key."}
                  value={drafts[row.id] ?? ""}
                  onChange={(e) => {
                    setDrafts((d) => ({ ...d, [row.id]: e.target.value }));
                    clearTestState(row.id);
                  }}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
                  autoComplete="off"
                />
                <button
                  type="button"
                  disabled={busy || draftKey.length < 10 || rowTestStatus === "testing"}
                  onClick={() => handleTest(row.id)}
                  className="whitespace-nowrap rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:border-black hover:text-black disabled:opacity-50"
                >
                  {rowTestStatus === "testing" ? "Testing." : "Test"}
                </button>
                <button
                  type="button"
                  disabled={busy || draftKey.length < 10}
                  onClick={() => handleSave(row.id)}
                  className="whitespace-nowrap rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Save
                </button>
              </div>

              {rowTestStatus === "valid" && (
                <p className="mt-1.5 text-xs font-medium text-green-700">Key looks valid.</p>
              )}
              {rowTestStatus === "invalid" && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{testMessage[row.id]}</p>
              )}

              <div className="mt-2 flex items-center justify-between text-xs">
                <a
                  href={CLIENT_PROVIDERS[row.id].helpUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-400 underline"
                >
                  Get a key at {CLIENT_PROVIDERS[row.id].helpText}
                </a>
                <div className="flex gap-3">
                  {row.hasKey && !row.active && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleActivate(row.id)}
                      className="font-medium text-black hover:underline disabled:opacity-50"
                    >
                      Set active
                    </button>
                  )}
                  {row.hasKey && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleClear(row.id)}
                      className="font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
