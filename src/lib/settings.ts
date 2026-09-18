import { invokeFunction } from "./functions";
import type { AiProvider, ProviderStatusRow } from "./types";

export function getProviderStatus(): Promise<ProviderStatusRow[]> {
  return invokeFunction<ProviderStatusRow[]>("get-provider-status");
}

export function saveApiKey(provider: AiProvider, apiKey: string): Promise<void> {
  return invokeFunction("save-api-key", { provider, apiKey });
}

export function clearApiKey(provider: AiProvider): Promise<void> {
  return invokeFunction("clear-api-key", { provider });
}

export function setActiveProvider(provider: AiProvider): Promise<void> {
  return invokeFunction("set-active-provider", { provider });
}

/** Validates a key against the vendor's API before it's saved. Throws on rejection. */
export function testApiKey(provider: AiProvider, apiKey: string): Promise<void> {
  return invokeFunction("test-api-key", { provider, apiKey });
}
