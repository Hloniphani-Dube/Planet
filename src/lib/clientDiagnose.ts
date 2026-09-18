import type Anthropic from "@anthropic-ai/sdk";
import { blobToBase64 } from "./blob";
import {
  buildUserPrompt,
  DIAGNOSIS_CATEGORIES,
  DIAGNOSIS_JSON_SCHEMA,
  SYSTEM_PROMPT,
} from "./diagnosisSchema";
import type { AiProvider, Diagnosis } from "./types";

interface ImageInput {
  base64: string;
  mimeType: string;
}

async function toImageInput(photo: Blob): Promise<ImageInput> {
  return { base64: await blobToBase64(photo), mimeType: photo.type || "image/jpeg" };
}

async function diagnoseWithClaude(
  apiKey: string,
  images: ImageInput[],
  weatherContext?: string,
): Promise<Diagnosis> {
  const { default: AnthropicSdk } = await import("@anthropic-ai/sdk");
  const client = new AnthropicSdk({ apiKey, dangerouslyAllowBrowser: true });

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: "record_diagnosis",
        description: "Record the plant diagnosis in a structured form.",
        input_schema: DIAGNOSIS_JSON_SCHEMA as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: "record_diagnosis" },
    messages: [
      {
        role: "user",
        content: [
          ...images.map((image) => ({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: image.mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
              data: image.base64,
            },
          })),
          { type: "text" as const, text: buildUserPrompt(images.length, weatherContext) },
        ],
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("Claude did not return a structured diagnosis.");
  }
  return toolUse.input as Diagnosis;
}

async function diagnoseWithOpenAI(
  apiKey: string,
  images: ImageInput[],
  weatherContext?: string,
): Promise<Diagnosis> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 512,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: buildUserPrompt(images.length, weatherContext) },
          ...images.map((image) => ({
            type: "image_url" as const,
            image_url: { url: `data:${image.mimeType};base64,${image.base64}` },
          })),
        ],
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "record_diagnosis",
          description: "Record the plant diagnosis in a structured form.",
          parameters: DIAGNOSIS_JSON_SCHEMA,
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "record_diagnosis" } },
  });

  const toolCall = completion.choices[0]?.message.tool_calls?.[0];
  if (!toolCall || toolCall.type !== "function") {
    throw new Error("OpenAI did not return a structured diagnosis.");
  }
  return JSON.parse(toolCall.function.arguments) as Diagnosis;
}

async function diagnoseWithGemini(
  apiKey: string,
  images: ImageInput[],
  weatherContext?: string,
): Promise<Diagnosis> {
  const { GoogleGenerativeAI, SchemaType } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          plantName: { type: SchemaType.STRING },
          category: {
            type: SchemaType.STRING,
            format: "enum",
            enum: [...DIAGNOSIS_CATEGORIES],
          },
          summary: { type: SchemaType.STRING },
          fix: { type: SchemaType.STRING },
          confidence: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["low", "medium", "high"],
          },
        },
        required: ["plantName", "category", "summary", "fix", "confidence"],
      },
    },
  });

  const result = await model.generateContent([
    ...images.map((image) => ({ inlineData: { mimeType: image.mimeType, data: image.base64 } })),
    { text: buildUserPrompt(images.length, weatherContext) },
  ]);

  return JSON.parse(result.response.text()) as Diagnosis;
}

async function testClaudeKey(apiKey: string): Promise<void> {
  const { default: AnthropicSdk } = await import("@anthropic-ai/sdk");
  const client = new AnthropicSdk({ apiKey, dangerouslyAllowBrowser: true });
  await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1,
    messages: [{ role: "user", content: "Hi" }],
  });
}

async function testOpenAIKey(apiKey: string): Promise<void> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  await client.models.list();
}

async function testGeminiKey(apiKey: string): Promise<void> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
  await model.generateContent("Hi");
}

interface ClientProviderDef {
  label: string;
  helpText: string;
  helpUrl: string;
  diagnose: (apiKey: string, images: ImageInput[], weatherContext?: string) => Promise<Diagnosis>;
  test: (apiKey: string) => Promise<void>;
}

export const CLIENT_PROVIDERS: Record<AiProvider, ClientProviderDef> = {
  claude: {
    label: "Claude",
    helpText: "console.anthropic.com",
    helpUrl: "https://console.anthropic.com/settings/keys",
    diagnose: diagnoseWithClaude,
    test: testClaudeKey,
  },
  openai: {
    label: "ChatGPT (OpenAI)",
    helpText: "platform.openai.com",
    helpUrl: "https://platform.openai.com/api-keys",
    diagnose: diagnoseWithOpenAI,
    test: testOpenAIKey,
  },
  gemini: {
    label: "Gemini (Google)",
    helpText: "aistudio.google.com",
    helpUrl: "https://aistudio.google.com/app/apikey",
    diagnose: diagnoseWithGemini,
    test: testGeminiKey,
  },
};

export const CLIENT_PROVIDER_IDS = Object.keys(CLIENT_PROVIDERS) as AiProvider[];

/** Calls the AI vendor's API directly from the browser with a visitor-supplied key.
 * No Supabase involved: nothing is authenticated, uploaded, or saved anywhere. */
export async function diagnosePlantInBrowser(
  provider: AiProvider,
  apiKey: string,
  photos: Blob[],
  weatherContext?: string,
): Promise<Diagnosis> {
  const images = await Promise.all(photos.map(toImageInput));
  return CLIENT_PROVIDERS[provider].diagnose(apiKey, images, weatherContext);
}

/** Throws if the key is invalid or rejected by the vendor; resolves on success. */
export async function testApiKeyInBrowser(provider: AiProvider, apiKey: string): Promise<void> {
  await CLIENT_PROVIDERS[provider].test(apiKey);
}
