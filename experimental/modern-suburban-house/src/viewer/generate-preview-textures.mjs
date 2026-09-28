/**
 * Deterministic colour tiles for the house viewer's material preview.
 * Run `node src/viewer/generate-preview-textures.mjs`; no external image input.
 * Coordinates and random lattice wrap at 512, so every PNG tiles on both axes.
 * Base colours follow docs/materials; the viewer marks each loaded colour map
 * sRGB and falls back to the preview binding's hex if loading fails.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const SIZE = 512;
const OUTPUT = new URL("../../public/textures/", import.meta.url);
mkdirSync(OUTPUT, { recursive: true });

/** @typedef {(x: number, y: number, u: number, v: number) => number[]} Sampler */
/** @param {number} value */
const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));
/** @param {number} value @param {number} size */
const mod = (value, size) => ((value % size) + size) % size;
/** @param {number} value */
const fract = (value) => value - Math.floor(value);
/** @param {number} value */
const distanceToEdge = (value) => Math.min(fract(value), 1 - fract(value));
/** @param {number} x @param {number} y @param {number} seed @param {number} period */
const hash = (x, y, seed, period) => {
  const a = mod(x, period), b = mod(y, period);
  let value = Math.imul(a + seed * 131, 374761393) + Math.imul(b + seed * 79, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
};
/** @param {number} x @param {number} y @param {number} period @param {number} seed */
const noise = (x, y, period, seed) => {
  const fx = x * period / SIZE, fy = y * period / SIZE;
  const ix = Math.floor(fx), iy = Math.floor(fy);
  const tx = fract(fx), ty = fract(fy);
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const a = hash(ix, iy, seed, period), b = hash(ix + 1, iy, seed, period);
  const c = hash(ix, iy + 1, seed, period), d = hash(ix + 1, iy + 1, seed, period);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
};
/** @param {number} hex @param {number} amount */
const base = (hex, amount) => [
  clamp((hex >> 16 & 255) + amount),
  clamp((hex >> 8 & 255) + amount),
  clamp((hex & 255) + amount),
];
/** @param {number} color @returns {Sampler} */
const concrete = (color) => (x, y) => {
  const grit = (noise(x, y, 64, 7) - 0.5) * 18 + (noise(x, y, 256, 8) - 0.5) * 12;
  const sweep = Math.sin(y * 2 * Math.PI * 20 / SIZE) * 1.8;
  return base(color, grit + sweep);
};

/** Each expression is periodic in u/v; module sizes live in materialPreview.ts. */
/** @type {Record<string, Sampler>} */
const textures = {
  "siding.png": (x, y, _u, v) => {
    const seam = distanceToEdge(v) < 0.022;
    const grain = (noise(x, y, 16, 1) - 0.5) * 9 + (noise(x, y, 64, 2) - 0.5) * 5;
    return base(seam ? 0xd3cec4 : 0xede8dc, grain);
  },
  "shingle.png": (x, y, u, v) => {
    const row = Math.floor(v * 2);
    const tab = distanceToEdge(u * 2 + (row % 2) * 0.5) < 0.018;
    const lap = distanceToEdge(v * 2) < 0.07;
    const mineral = (noise(x, y, 32, 3) - 0.5) * 21 + (noise(x, y, 128, 4) - 0.5) * 11;
    return base(lap || tab ? 0x26282a : 0x3a3c3e, mineral);
  },
  "brick.png": (x, y, u, v) => {
    const row = Math.floor(v * 2);
    const mortar = distanceToEdge(v * 2) < 0.077 || distanceToEdge(u * 2 + (row % 2) * 0.5) < 0.025;
    const fired = (noise(x, y, 16, 5) - 0.5) * 23 + (noise(x, y, 64, 6) - 0.5) * 12;
    return base(mortar ? 0xbdb5a8 : 0x8a4a3a, mortar ? 0 : fired);
  },
  "concrete.png": concrete(0xb4b0a8),
  "porch.png": concrete(0xa8a49c),
  "garage.png": concrete(0x9c9890),
  "timber.png": (x, y, u) => {
    const edge = distanceToEdge(u) < 0.015;
    const vein = Math.sin((u * 11 + noise(x, y, 8, 9) * 0.38) * 2 * Math.PI) * 7;
    return base(
      edge ? 0x624b34 : 0x8c6a48,
      vein + (noise(x, y, 32, 10) - 0.5) * 10,
    );
  },
  "oak.png": (x, y, u, v) => {
    const joint = distanceToEdge(u) < 0.012 || distanceToEdge(v) < 0.006;
    const grain = Math.sin((u * 15 + noise(x, y, 8, 11) * 0.33) * 2 * Math.PI) * 7;
    return base(
      joint ? 0x815b39 : 0xb08050,
      grain + (noise(x, y, 64, 12) - 0.5) * 9,
    );
  },
  "tile.png": (x, y, u, v) => {
    const grout = distanceToEdge(u) < 0.00833 || distanceToEdge(v) < 0.00833;
    return base(grout ? 0xa9a39a : 0xd8d4cc, (noise(x, y, 16, 13) - 0.5) * 5);
  },
  "carpet.png": (x, y) => base(0xcdbfa6, (noise(x, y, 128, 14) - 0.5) * 21),
  "woven.png": (x, y, u, v) => {
    const warp = Math.sin(u * 2 * Math.PI * 64) * 5;
    const weft = Math.sin(v * 2 * Math.PI * 64) * 5;
    return base(0xd8d8d8, warp + weft + (noise(x, y, 64, 18) - 0.5) * 7);
  },
  "grass.png": (x, y) => {
    const fleck = (noise(x, y, 128, 15) - 0.5) * 32 + (noise(x, y, 16, 16) - 0.5) * 22;
    const earth = noise(x, y, 8, 17) > 0.76;
    return base(earth ? 0x76684b : 0x687a49, fleck);
  },
};

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
/** @param {Buffer} data */
const crc32 = (data) => {
  let value = 0xffffffff;
  for (const byte of data) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
};
/** @param {string} name @param {Buffer} data */
const chunk = (name, data) => {
  const tag = Buffer.from(name);
  const size = Buffer.alloc(4), crc = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([tag, data])));
  return Buffer.concat([size, tag, data, crc]);
};
/** @param {Buffer} pixels */
const png = (pixels) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(SIZE, 0);
  header.writeUInt32BE(SIZE, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

for (const [name, sample] of Object.entries(textures)) {
  const pixels = Buffer.alloc(SIZE * (1 + SIZE * 4));
  for (let y = 0; y < SIZE; y++) {
    const row = y * (1 + SIZE * 4);
    pixels[row] = 0;
    for (let x = 0; x < SIZE; x++) {
      const rgb = sample(x, y, x / SIZE, y / SIZE);
      const offset = row + 1 + x * 4;
      pixels[offset] = rgb[0];
      pixels[offset + 1] = rgb[1];
      pixels[offset + 2] = rgb[2];
      pixels[offset + 3] = 255;
    }
  }
  const file = join(fileURLToPath(OUTPUT), name);
  writeFileSync(file, png(pixels));
  console.log(`${name}: ${SIZE}x${SIZE}`);
}
