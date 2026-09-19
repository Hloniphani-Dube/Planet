// Generates the app's PNG icons (a white leaf on a green tile) without any image library.
// Run with: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = new URL("../public/", import.meta.url);
mkdirSync(OUT, { recursive: true });

// CRC32 for PNG chunks.
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}
function encodePng(size, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Leaf: the overlap of two circles (a lens), rotated 45 degrees, with a midrib.
const HALF_LENGTH = 0.6;
const HALF_WIDTH = 0.33;
const R = (HALF_WIDTH + (HALF_LENGTH * HALF_LENGTH) / HALF_WIDTH) / 2;
const C = ((HALF_LENGTH * HALF_LENGTH) / HALF_WIDTH - HALF_WIDTH) / 2;
const COS = Math.cos(Math.PI / 4);
const SIN = Math.sin(Math.PI / 4);

function insideRoundedSquare(x, y, radius) {
  const ax = Math.abs(x) - (1 - radius);
  const ay = Math.abs(y) - (1 - radius);
  if (ax <= 0 || ay <= 0) return Math.abs(x) <= 1 && Math.abs(y) <= 1;
  return ax * ax + ay * ay <= radius * radius;
}

function sample(x, y, fullBleed) {
  // Background tile.
  if (!fullBleed && !insideRoundedSquare(x, y, 0.22)) return [0, 0, 0, 0];
  const t = (x + y + 2) / 4;
  let color = [22 + (20 - 22) * t, 163 + (83 - 163) * t, 74 + (45 - 74) * t];

  // Rotate into the leaf's own axes (long axis along u).
  const u = x * COS - y * SIN;
  const v = x * SIN + y * COS;
  const inLens = Math.hypot(u, v - C) <= R && Math.hypot(u, v + C) <= R;
  if (inLens) {
    color = [255, 255, 255];
    if (Math.abs(v) < 0.02 && Math.abs(u) < HALF_LENGTH * 0.86) color = [21, 128, 61];
  }
  return [...color, 255];
}

function render(size, fullBleed) {
  const rgba = Buffer.alloc(size * size * 4);
  const samples = 3;
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const x = ((px + (sx + 0.5) / samples) / size) * 2 - 1;
          const y = ((py + (sy + 0.5) / samples) / size) * 2 - 1;
          const [sr, sg, sb, sa] = sample(x, y, fullBleed);
          r += sr * sa;
          g += sg * sa;
          b += sb * sa;
          a += sa;
        }
      }
      const i = (py * size + px) * 4;
      if (a > 0) {
        rgba[i] = Math.round(r / a);
        rgba[i + 1] = Math.round(g / a);
        rgba[i + 2] = Math.round(b / a);
      }
      rgba[i + 3] = Math.round(a / (samples * samples));
    }
  }
  return rgba;
}

const icons = [
  ["pwa-192x192.png", 192, false],
  ["pwa-512x512.png", 512, false],
  ["pwa-maskable-512x512.png", 512, true],
  ["apple-touch-icon.png", 180, true],
];
for (const [name, size, fullBleed] of icons) {
  writeFileSync(new URL(name, OUT), encodePng(size, render(size, fullBleed)));
  console.log(`wrote public/${name}`);
}
