/**
 * Deterministic sRGB tiles for authored building finishes. These six tiles are
 * derived from docs/materials/01-exterior.md and 02-interior-shell.md, not from
 * photographs. Run `node src/materials/generate-building-textures.mjs` after
 * changing their swatches or pattern modules. Viewer sampling supplies metres
 * per repeat from the owning finish; no UV or host geometry is invented here.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const SIZE = 256;
const OUTPUT = fileURLToPath(
  new URL("../../public/textures/", import.meta.url),
);
/** @param {number} value */
const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));
/** @param {number} value */
const fract = (value) => value - Math.floor(value);
/** @param {number} value */
const distanceToEdge = (value) => Math.min(fract(value), 1 - fract(value));
/** @param {number} x @param {number} y @param {number} seed */
const hash = (x, y, seed) => {
  let value =
    Math.imul((x % SIZE) + seed * 131, 374761393) +
    Math.imul((y % SIZE) + seed * 79, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
};
/** @param {number} hex @param {number} shift */
const tint = (hex, shift) => [
  clamp(((hex >> 16) & 255) + shift),
  clamp(((hex >> 8) & 255) + shift),
  clamp((hex & 255) + shift),
];

/** @type {Record<string, (x: number, y: number) => number[]>} */
const tiles = {
  "exterior-trim.png": (x, y) => tint(0xf6f4ee, (hash(x, y, 1) - 0.5) * 3),
  "charcoal-frame.png": (x, y) =>
    tint(
      0x2e3033,
      (hash(x, y, 2) - 0.5) * 4 + Math.sin((y / SIZE) * Math.PI * 2) * 1.2,
    ),
  "obscured-glass.png": (x, y) => tint(0xe8eef0, (hash(x, y, 3) - 0.5) * 12),
  "front-door-oak.png": (x, y) => {
    const u = x / SIZE,
      v = y / SIZE;
    const grain =
      Math.sin((u * 13 + Math.sin(v * Math.PI * 2) * 0.07) * Math.PI * 2) * 5;
    return tint(0x9a6a3e, grain + (hash(x, y, 4) - 0.5) * 3);
  },
  "garage-door-steel.png": (x, y) =>
    tint(
      0x34373a,
      Math.sin((y / SIZE) * Math.PI * 16) * 1.6 + (hash(x, y, 5) - 0.5) * 3,
    ),
  "wall-tile.png": (x, y) => {
    const grout =
      distanceToEdge(x / SIZE) < 0.005 / 0.3 / 2 ||
      distanceToEdge(y / SIZE) < 0.005 / 0.1 / 2;
    return tint(grout ? 0xa9a39a : 0xeeedea, (hash(x, y, 6) - 0.5) * 2);
  },
};

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++)
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
/** @param {Buffer} data */
const crc32 = (data) => {
  let value = 0xffffffff;
  for (const byte of data)
    value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
};
/** @param {string} name @param {Buffer} data */
const chunk = (name, data) => {
  const tag = Buffer.from(name);
  const size = Buffer.alloc(4),
    crc = Buffer.alloc(4);
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

for (const [name, sample] of Object.entries(tiles)) {
  const pixels = Buffer.alloc(SIZE * (1 + SIZE * 4));
  for (let y = 0; y < SIZE; y++) {
    const row = y * (1 + SIZE * 4);
    pixels[row] = 0;
    for (let x = 0; x < SIZE; x++) {
      const [r, g, b] = sample(x, y);
      const offset = row + 1 + x * 4;
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = 255;
    }
  }
  writeFileSync(join(OUTPUT, name), png(pixels));
}
