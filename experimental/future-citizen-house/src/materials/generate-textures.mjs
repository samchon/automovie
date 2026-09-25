// @ts-check
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const tau = Math.PI * 2;
/** @param {number} u @param {number} v @param {number} ax @param {number} ay @param {number} [phase] */
const wave = (u, v, ax, ay, phase = 0) => Math.sin(tau * (u * ax + v * ay) + phase);
/** @param {number} v */
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
/** @param {number} v */
const fract = (v) => v - Math.floor(v);
/** Smooth wrapped lattice noise, periodic at 64 texels on both axes.
 * @param {number} x @param {number} y @param {number} seed */
const noise = (x, y, seed) => {
  const gx = x / 4, gy = y / 4, ix = Math.floor(gx), iy = Math.floor(gy);
  const sx = (gx - ix) ** 2 * (3 - 2 * (gx - ix));
  const sy = (gy - iy) ** 2 * (3 - 2 * (gy - iy));
  /** @param {number} a @param {number} b */
  const hash = (a, b) => fract(Math.sin((a % 16) * 127.1 + (b % 16) * 311.7 + seed * 74.7) * 43758.5453);
  const left = hash(ix, iy) * (1 - sy) + hash(ix, iy + 1) * sy;
  const right = hash(ix + 1, iy) * (1 - sy) + hash(ix + 1, iy + 1) * sy;
  return left * (1 - sx) + right * sx;
};

/** Periodic authored colour samples. Grout and board joints stay in geometry;
 * image detail is limited to albedo variation at the declared metric scale. */
export function makeTextureAssets() {
  /** @type {[string, (u: number, v: number, x: number, y: number) => number[]][]} */
  const recipes = [
    ["limestone-grain", (u, v, x, y) => { const cloud = wave(u, v, 2, 1) * 2.5 + wave(u, v, 3, -2, 0.8) * 1.5; const fleck = (noise(x % 64, y % 64, 2081) - 0.5) * 5; return [247 + cloud + fleck, 247 + cloud + fleck, 247 + cloud + fleck]; }],
    ["paint-grain", (u, v, x, y) => { const n = (noise(x % 64, y % 64, 2082) - 0.5) * 3 + wave(u, v, 2, 1) * 0.6; return [251 + n, 251 + n, 251 + n]; }],
    ["oak-grain", (u, v) => { const bend = 0.018 * wave(u, v, 1, 2); const grain = Math.sin(tau * (u * 22 + bend)) * 7 + Math.sin(tau * (u * 7 - bend)) * 5 + wave(u, v, 2, 1) * 2; return [244 + grain, 244 + grain, 244 + grain]; }],
    ["woven-grain", (u, v, x, y) => { const weave = wave(u, v, 32, 0) * wave(u, v, 0, 32) * 4; const fleck = (noise(x % 64, y % 64, 2083) - 0.5) * 3; return [246 + weave + fleck, 246 + weave + fleck, 246 + weave + fleck]; }],
    ["tile-grain", (u, v, x, y) => { const fleck = (noise(x % 64, y % 64, 2084) - 0.5) * 5 + wave(u, v, 3, 2) * 2; return [247 + fleck, 247 + fleck, 247 + fleck]; }],
    ["earth-grain", (u, v, x, y) => { const n = (noise(x % 64, y % 64, 2085) - 0.5) * 32 + wave(u, v, 4, 3) * 9 + wave(u, v, 9, -4) * 5; return [225 + n, 230 + n, 215 + n]; }],
    ["paving-grain", (u, v, x, y) => { const n = (noise(x % 64, y % 64, 2086) - 0.5) * 12 + wave(u, v, 3, 2) * 3; return [242 + n, 242 + n, 240 + n]; }],
  ];
  return recipes.map(([id, sample]) => {
    const size = id === "limestone-grain" ? 512 : 256;
    const rgba = [];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const rgb = sample(u, v, x, y);
      rgba.push(clamp(rgb[0]), clamp(rgb[1]), clamp(rgb[2]), 255);
    }
    return { id, width: size, height: size, rgba };
  });
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
/** @param {Buffer} bytes */
const crc = (bytes) => { let c = 0xffffffff; for (const b of bytes) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
/** @param {string} name @param {Buffer} data */
const chunk = (name, data) => {
  const body = Buffer.concat([Buffer.from(name), data]);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc(body));
  return Buffer.concat([length, body, checksum]);
};
/** @param {{ width: number; height: number; rgba: number[] }} asset */
function png(asset) {
  const header = Buffer.alloc(13); header.writeUInt32BE(asset.width, 0); header.writeUInt32BE(asset.height, 4); header[8] = 8; header[9] = 6;
  const rows = [];
  for (let y = 0; y < asset.height; y++) rows.push(Buffer.from([0]), Buffer.from(asset.rgba.slice(y * asset.width * 4, (y + 1) * asset.width * 4)));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const directory = resolve("public/textures");
  mkdirSync(directory, { recursive: true });
  for (const asset of makeTextureAssets()) writeFileSync(resolve(directory, asset.id + ".png"), png(asset));
}
