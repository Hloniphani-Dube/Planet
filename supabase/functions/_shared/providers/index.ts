import { diagnoseWithClaude, testClaudeKey } from "./claude.ts";
import { diagnoseWithOpenAI, testOpenAIKey } from "./openai.ts";
import { diagnoseWithGemini, testGeminiKey } from "./gemini.ts";
import type { AiProvider, Diagnosis, ImageInput } from "../types.ts";

interface ProviderDef {
  label: string;
  diagnose: (
    apiKey: string,
    images: ImageInput[],
    weatherContext?: string,
    userNotes?: string,
  ) => Promise<Diagnosis>;
  test: (apiKey: string) => Promise<void>;
}

export const PROVIDERS: Record<AiProvider, ProviderDef> = {
  claude: { label: "Claude", diagnose: diagnoseWithClaude, test: testClaudeKey },
  openai: { label: "ChatGPT (OpenAI)", diagnose: diagnoseWithOpenAI, test: testOpenAIKey },
  gemini: { label: "Gemini (Google)", diagnose: diagnoseWithGemini, test: testGeminiKey },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as AiProvider[];
