import { healthLabels } from "./health";
import type { Diagnosis } from "./types";

const WIDTH = 1080;
const HEIGHT = 1350;
const PHOTO_HEIGHT = 600;
const PAD = 64;

const STATUS_COLOR: Record<Diagnosis["healthStatus"], string> = {
  healthy: "#16a34a",
  needs_attention: "#d97706",
  critical: "#dc2626",
  unknown: "#6b7280",
};

async function loadBitmap(source: Blob | string | undefined): Promise<ImageBitmap | null> {
  if (!source) return null;
  try {
    // Fetching (rather than drawing an <img>) means a cross-origin photo can't taint the
    // canvas; Supabase public storage sends permissive CORS headers.
    const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
    return await createImageBitmap(blob);
  } catch {
    return null;
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (let i = 0; i < words.length; i += 1) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      continue;
    }
    lines.push(line);
    line = words[i];
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && line) lines.push(line);

  // If we ran out of lines with words left over, end the last line with an ellipsis.
  const consumed = lines.join(" ").split(/\s+/).length;
  if (consumed < words.length && lines.length > 0) {
    let last = lines[lines.length - 1];
    while (last.length > 1 && ctx.measureText(`${last}...`).width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last.trimEnd()}...`;
  }
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLeaf(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.bezierCurveTo(size * 0.9, -size * 0.5, size * 0.9, size * 0.5, 0, size);
  ctx.bezierCurveTo(-size * 0.9, size * 0.5, -size * 0.9, -size * 0.5, 0, -size);
  ctx.fill();
  ctx.restore();
}

function drawPhoto(ctx: CanvasRenderingContext2D, bitmap: ImageBitmap): void {
  const scale = Math.max(WIDTH / bitmap.width, PHOTO_HEIGHT / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  // Cover-fit, clipped to the photo panel so a tall image can't spill onto the text below.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, WIDTH, PHOTO_HEIGHT);
  ctx.clip();
  ctx.drawImage(bitmap, (WIDTH - w) / 2, (PHOTO_HEIGHT - h) / 2, w, h);
  ctx.restore();
}

/** Renders a clean, always-light diagnosis card to a PNG: photo, plain-language summary, the
 * fix, and severity. Drawn with the canvas directly so it needs no extra library. */
export async function renderShareCard(diagnosis: Diagnosis, photo?: Blob | string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available in this browser.");

  const font = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

  ctx.fillStyle = "#f7faf6";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Photo, or a green panel with a leaf when there isn't one.
  const bitmap = await loadBitmap(photo);
  if (bitmap) {
    drawPhoto(ctx, bitmap);
    bitmap.close();
  } else {
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, PHOTO_HEIGHT);
    gradient.addColorStop(0, "#14532d");
    gradient.addColorStop(1, "#16a34a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, PHOTO_HEIGHT);
    drawLeaf(ctx, WIDTH / 2, PHOTO_HEIGHT / 2, 170, "rgba(255,255,255,0.9)");
  }

  // Darken the bottom of the photo so the name reads on any image.
  const fade = ctx.createLinearGradient(0, PHOTO_HEIGHT - 260, 0, PHOTO_HEIGHT);
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, PHOTO_HEIGHT - 260, WIDTH, 260);

  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 64px ${font}`;
  const nameLines = wrap(ctx, diagnosis.plantName, WIDTH - PAD * 2, 1);
  ctx.fillText(nameLines[0] ?? "", PAD, PHOTO_HEIGHT - 70);
  if (diagnosis.scientificName) {
    ctx.font = `italic 30px ${font}`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(diagnosis.scientificName, PAD, PHOTO_HEIGHT - 26);
  }

  // Status pill, top left of the photo.
  const status = healthLabels[diagnosis.healthStatus];
  ctx.font = `600 30px ${font}`;
  const pillW = ctx.measureText(status).width + 64;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  roundRect(ctx, PAD, 48, pillW, 60, 30);
  ctx.fill();
  ctx.fillStyle = STATUS_COLOR[diagnosis.healthStatus];
  ctx.beginPath();
  ctx.arc(PAD + 30, 78, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#171717";
  ctx.fillText(status, PAD + 52, 89);

  // What it sees.
  let y = PHOTO_HEIGHT + 78;
  ctx.fillStyle = "#6b7280";
  ctx.font = `600 26px ${font}`;
  ctx.fillText("WHAT PLANET-I-GREEN SEES", PAD, y);
  y += 52;
  ctx.fillStyle = "#171717";
  ctx.font = `400 38px ${font}`;
  for (const line of wrap(ctx, diagnosis.summary, WIDTH - PAD * 2, 3)) {
    ctx.fillText(line, PAD, y);
    y += 54;
  }

  // The fix.
  y += 18;
  const boxTop = y;
  ctx.font = `500 34px ${font}`;
  const fixLines = wrap(ctx, diagnosis.fix, WIDTH - PAD * 2 - 64, 3);
  const boxHeight = 100 + fixLines.length * 48;
  ctx.fillStyle = "#e7f3e8";
  roundRect(ctx, PAD, boxTop, WIDTH - PAD * 2, boxHeight, 28);
  ctx.fill();
  ctx.fillStyle = "#166534";
  ctx.font = `600 24px ${font}`;
  ctx.fillText("THE FIX", PAD + 32, boxTop + 50);
  ctx.fillStyle = "#14351f";
  ctx.font = `500 34px ${font}`;
  fixLines.forEach((line, i) => ctx.fillText(line, PAD + 32, boxTop + 100 + i * 48));

  // Severity bar.
  const barY = HEIGHT - 150;
  ctx.fillStyle = "#6b7280";
  ctx.font = `600 24px ${font}`;
  ctx.fillText(`SEVERITY  ${diagnosis.severityScore} / 10`, PAD, barY - 18);
  ctx.fillStyle = "#e5e7eb";
  roundRect(ctx, PAD, barY, WIDTH - PAD * 2, 16, 8);
  ctx.fill();
  const fill = Math.max(16, ((WIDTH - PAD * 2) * diagnosis.severityScore) / 10);
  ctx.fillStyle = STATUS_COLOR[diagnosis.severityScore <= 3 ? "healthy" : diagnosis.severityScore <= 6 ? "needs_attention" : "critical"];
  roundRect(ctx, PAD, barY, fill, 16, 8);
  ctx.fill();

  // Footer.
  drawLeaf(ctx, PAD + 22, HEIGHT - 58, 20, "#16a34a");
  ctx.fillStyle = "#171717";
  ctx.font = `700 32px ${font}`;
  ctx.fillText("Planet-i-Green", PAD + 62, HEIGHT - 46);
  ctx.fillStyle = "#6b7280";
  ctx.font = `400 26px ${font}`;
  ctx.textAlign = "right";
  ctx.fillText("Point a camera at a plant", WIDTH - PAD, HEIGHT - 46);
  ctx.textAlign = "left";

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't create the image."))), "image/png");
  });
}

export type ShareOutcome = "shared" | "downloaded" | "cancelled";

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Uses the native share sheet with the image where the browser supports it (most phones);
 * otherwise saves the PNG. A `url` is included when the report has a public page. */
export async function shareDiagnosis(
  diagnosis: Diagnosis,
  photo?: Blob | string,
  url?: string,
): Promise<ShareOutcome> {
  const blob = await renderShareCard(diagnosis, photo);
  const slug = diagnosis.plantName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "plant";
  const file = new File([blob], `planet-i-green-${slug}.png`, { type: "image/png" });
  const text = `${diagnosis.plantName}: ${diagnosis.summary} Fix: ${diagnosis.fix}`;

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `${diagnosis.plantName} on Planet-i-Green`, text, url });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      // Any other failure: fall through to a plain download.
    }
  }

  download(blob, file.name);
  return "downloaded";
}
