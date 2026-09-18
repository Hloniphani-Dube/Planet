import { GoogleGenerativeAI, SchemaType } from "npm:@google/generative-ai@0.24.1";
import { buildUserPrompt, DIAGNOSIS_CATEGORIES, SYSTEM_PROMPT } from "../schema.ts";
import type { Diagnosis, ImageInput } from "../types.ts";

export async function diagnoseWithGemini(
  apiKey: string,
  images: ImageInput[],
  weatherContext?: string,
): Promise<Diagnosis> {
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

/** Cheapest possible authenticated call, used only to validate a key before saving it. */
export async function testGeminiKey(apiKey: string): Promise<void> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
  await model.generateContent("Hi");
}
