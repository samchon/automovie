/**
 * Reproducible 256 px tile images for the six temple finish families.
 * Run with `node src/materials/generate-textures.mjs` from this production root.
 * The script owns all pixels; no downloaded art or image library is involved.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

const size = 256;
const out = "public/textures";
mkdirSync(out, { recursive: true });
const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
const fract = (n) => n - Math.floor(n);
const hash = (x, y, seed) => fract(Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123);
const smooth = (t) => t * t * (3 - 2 * t);
const noise = (u, v, cells, seed) => {
  const x = u * cells;
  const y = v * cells;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(fract(x));
  const fy = smooth(fract(y));
  const sample = (dx, dy) => hash((ix + dx) % cells, (iy + dy) % cells, seed);
  const a = sample(0, 0) * (1 - fx) + sample(1, 0) * fx;
  const b = sample(0, 1) * (1 - fx) + sample(1, 1) * fx;
  return a * (1 - fy) + b * fy;
};
const edge = (value) => Math.min(fract(value), 1 - fract(value));
const pattern = {
  stone: (u, v) => 225 + 27 * (noise(u, v, 8, 1) - 0.5) + 20 * (noise(u, v, 48, 2) - 0.5),
  paving: (u, v) => {
    const row = Math.floor(v * 4);
    const joint = edge((u + (row % 2) * 0.125) * 4) < 0.009 || edge(v * 4) < 0.009;
    return joint ? 164 : 230 + 16 * (noise(u, v, 16, 11) - 0.5) + 8 * (noise(u, v, 64, 12) - 0.5);
  },
  plaster: (u, v) => 235 + 14 * (noise(u, v, 5, 3) - 0.5) + 8 * (noise(u, v, 25, 4) - 0.5),
  timber: (u, v) => {
    const bend = 0.018 * Math.sin(2 * Math.PI * u * 3) + 0.011 * Math.sin(2 * Math.PI * u * 7);
    const ring = Math.sin(2 * Math.PI * (v * 21 + bend * 21 + 0.45 * noise(u, v, 4, 5)));
    return 228 + 8 * ring + 10 * (noise(u, v, 16, 6) - 0.5);
  },
  tile: (u, v) => {
    const grout = edge(u * 4) < 0.025 || edge(v * 8) < 0.05;
    return grout ? 146 : 225 + 32 * (noise(u, v, 8, 7) - 0.5) + 13 * (noise(u, v, 32, 8) - 0.5);
  },
  textile: (u, v) => {
    const warp = Math.sin(2 * Math.PI * u * 32);
    const weft = Math.sin(2 * Math.PI * v * 32);
    return 225 + 16 * warp + 15 * weft + 7 * warp * weft;
  },
  earth: (u, v) => 215 + 30 * (noise(u, v, 7, 9) - 0.5) + 35 * (noise(u, v, 45, 10) - 0.5),
};

const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let c = index;
  for (let bit = 0; bit < 8; bit++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (name, data) => {
  const kind = Buffer.from(name);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const check = Buffer.alloc(4);
  check.writeUInt32BE(crc(Buffer.concat([kind, data])));
  return Buffer.concat([length, kind, data, check]);
};
for (const [name, shade] of Object.entries(pattern)) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const value = clamp(shade(x / size, y / size));
      const at = row + 1 + x * 4;
      raw[at] = value;
      raw[at + 1] = value;
      raw[at + 2] = value;
      raw[at + 3] = 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  const path = `${out}/${name}.png`;
  writeFileSync(path, png);
  console.log(`${path} ${png.length} bytes`);
}
