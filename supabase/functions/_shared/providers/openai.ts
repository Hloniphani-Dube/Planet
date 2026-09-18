import OpenAI from "npm:openai@4.104.0";
import { buildUserPrompt, DIAGNOSIS_JSON_SCHEMA, SYSTEM_PROMPT } from "../schema.ts";
import type { Diagnosis, ImageInput } from "../types.ts";

const RECORD_DIAGNOSIS_FUNCTION = {
  name: "record_diagnosis",
  description: "Record the plant diagnosis in a structured form.",
  parameters: DIAGNOSIS_JSON_SCHEMA,
};

export async function diagnoseWithOpenAI(
  apiKey: string,
  images: ImageInput[],
  weatherContext?: string,
): Promise<Diagnosis> {
  const client = new OpenAI({ apiKey });

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
    tools: [{ type: "function", function: RECORD_DIAGNOSIS_FUNCTION }],
    tool_choice: { type: "function", function: { name: "record_diagnosis" } },
  });

  const toolCall = completion.choices[0]?.message.tool_calls?.[0];
  if (!toolCall || toolCall.type !== "function") {
    throw new Error("OpenAI did not return a structured diagnosis.");
  }
  return JSON.parse(toolCall.function.arguments) as Diagnosis;
}

/** Cheapest possible authenticated call, used only to validate a key before saving it. */
export async function testOpenAIKey(apiKey: string): Promise<void> {
  const client = new OpenAI({ apiKey });
  await client.models.list();
}
