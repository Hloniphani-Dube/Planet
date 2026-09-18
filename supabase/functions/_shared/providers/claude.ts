import Anthropic from "npm:@anthropic-ai/sdk@0.32.1";
import { buildUserPrompt, DIAGNOSIS_JSON_SCHEMA, SYSTEM_PROMPT } from "../schema.ts";
import type { Diagnosis, ImageInput } from "../types.ts";

const RECORD_DIAGNOSIS_TOOL = {
  name: "record_diagnosis",
  description: "Record the plant diagnosis in a structured form.",
  input_schema: DIAGNOSIS_JSON_SCHEMA,
};

export async function diagnoseWithClaude(
  apiKey: string,
  images: ImageInput[],
  weatherContext?: string,
): Promise<Diagnosis> {
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    tools: [RECORD_DIAGNOSIS_TOOL],
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
          { type: "text", text: buildUserPrompt(images.length, weatherContext) },
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

/** Cheapest possible authenticated call, used only to validate a key before saving it. */
export async function testClaudeKey(apiKey: string): Promise<void> {
  const client = new Anthropic({ apiKey });
  await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1,
    messages: [{ role: "user", content: "Hi" }],
  });
}
