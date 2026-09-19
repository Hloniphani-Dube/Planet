import { GoogleGenerativeAI, type ResponseSchema } from "npm:@google/generative-ai@0.24.1";
import { buildUserPrompt, DIAGNOSIS_JSON_SCHEMA, SYSTEM_PROMPT, toGeminiSchema } from "../schema.ts";
import type { Diagnosis, ImageInput } from "../types.ts";

export async function diagnoseWithGemini(
  apiKey: string,
  images: ImageInput[],
  weatherContext?: string,
  userNotes?: string,
): Promise<Diagnosis> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      // Gemini's dialect of the same JSON Schema the other providers use.
      responseSchema: toGeminiSchema(DIAGNOSIS_JSON_SCHEMA) as unknown as ResponseSchema,
    },
  });

  const result = await model.generateContent([
    ...images.map((image) => ({ inlineData: { mimeType: image.mimeType, data: image.base64 } })),
    { text: buildUserPrompt(images.length, weatherContext, userNotes) },
  ]);

  return JSON.parse(result.response.text()) as Diagnosis;
}

/** Cheapest possible authenticated call, used only to validate a key before saving it. */
export async function testGeminiKey(apiKey: string): Promise<void> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
  await model.generateContent("Hi");
}
