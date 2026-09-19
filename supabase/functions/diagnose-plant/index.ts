import { corsHeaders } from "../_shared/cors.ts";
import { jsonError } from "../_shared/http.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { PROVIDERS } from "../_shared/providers/index.ts";
import type { AiProvider, ImageInput } from "../_shared/types.ts";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGES = 4;
const MAX_TEXT_LENGTH = 2000;

function isValidImage(value: unknown): value is ImageInput {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ImageInput).base64 === "string" &&
    (value as ImageInput).base64.length > 0 &&
    ALLOWED_MIME_TYPES.includes((value as ImageInput).mimeType)
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Only signed-in callers (anonymous sessions count) can spend the operator's AI key.
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Sign in required.", 401);

  let body: { images?: unknown; weatherContext?: unknown; userNotes?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError("Request body must be JSON.", 400);
  }
  const { images, weatherContext, userNotes } = body;

  if (!Array.isArray(images) || images.length === 0 || images.length > MAX_IMAGES) {
    return jsonError(`Provide between 1 and ${MAX_IMAGES} images.`, 400);
  }
  if (!images.every(isValidImage)) {
    return jsonError("Unsupported or missing image data.", 400);
  }
  if (
    weatherContext !== undefined &&
    (typeof weatherContext !== "string" || weatherContext.length > MAX_TEXT_LENGTH)
  ) {
    return jsonError("weatherContext must be a short string.", 400);
  }
  if (userNotes !== undefined && (typeof userNotes !== "string" || userNotes.length > MAX_TEXT_LENGTH)) {
    return jsonError("userNotes must be a short string.", 400);
  }

  const admin = createAdminClient();

  const { data: configRow } = await admin
    .from("app_config")
    .select("value")
    .eq("key", "active_provider")
    .maybeSingle();

  const active = configRow?.value as AiProvider | undefined;
  if (!active) {
    return jsonError("No AI provider is set up yet. Add an API key in Settings.", 412);
  }

  const { data: secretRow } = await admin
    .from("secrets")
    .select("api_key")
    .eq("provider", active)
    .maybeSingle();

  const apiKey = secretRow?.api_key as string | undefined;
  if (!apiKey) {
    return jsonError(`No API key saved for ${PROVIDERS[active].label}.`, 412);
  }

  try {
    const diagnosis = await PROVIDERS[active].diagnose(
      apiKey,
      images,
      weatherContext as string | undefined,
      userNotes as string | undefined,
    );
    return new Response(JSON.stringify(diagnosis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`Diagnosis failed via ${active}`, err);
    return jsonError(`${PROVIDERS[active].label} couldn't diagnose this photo.`, 500);
  }
});
