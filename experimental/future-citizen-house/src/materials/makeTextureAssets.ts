import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { deflateSync } from "node:zlib";

const tau = Math.PI * 2;
const wave = (u: number, v: number, ax: number, ay: number, phase: number = 0) =>
  Math.sin(tau * (u * ax + v * ay) + phase);
const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const fract = (v: number) => v - Math.floor(v);
/** Smooth wrapped lattice noise, periodic at 64 texels on both axes.
 * @param  x @param  y @param  seed */
const noise = (x: number, y: number, seed: number) => {
  const gx = x / 4,
    gy = y / 4,
    ix = Math.floor(gx),
    iy = Math.floor(gy);
  const sx = (gx - ix) ** 2 * (3 - 2 * (gx - ix));
  const sy = (gy - iy) ** 2 * (3 - 2 * (gy - iy));
    const hash = (a: number, b: number) =>
    fract(
      Math.sin((a % 16) * 127.1 + (b % 16) * 311.7 + seed * 74.7) * 43758.5453,
    );
  const left = hash(ix, iy) * (1 - sy) + hash(ix, iy + 1) * sy;
  const right = hash(ix + 1, iy) * (1 - sy) + hash(ix + 1, iy + 1) * sy;
  return left * (1 - sx) + right * sx;
};

/** Periodic authored colour samples. Grout and board joints stay in geometry;
 * image detail is limited to albedo variation at the declared metric scale. */
export function makeTextureAssets() {
    const recipes: [string, (u: number, v: number, x: number, y: number) => number[]][] = [
    [
      "limestone-grain",
      (u, v, x, y) => {
        const cloud = wave(u, v, 2, 1) * 2.5 + wave(u, v, 3, -2, 0.8) * 1.5;
        const fleck = (noise(x % 64, y % 64, 2081) - 0.5) * 5;
        return [253 + cloud + fleck, 253 + cloud + fleck, 253 + cloud + fleck];
      },
    ],
    [
      "cassette-grain",
      (u, v, x, y) => {
        const grain =
          (noise(x % 64, y % 64, 2087) - 0.5) * 4 + wave(u, v, 2, 1) * 0.5;
        return [248 + grain, 248 + grain, 248 + grain];
      },
    ],
    [
      "seal-grain",
      (u, v, x, y) => {
        const grain =
          (noise(x % 64, y % 64, 2088) - 0.5) * 2 + wave(u, v, 1, 1) * 0.2;
        return [249 + grain, 249 + grain, 249 + grain];
      },
    ],
    [
      "paint-grain",
      (u, v, x, y) => {
        const n =
          (noise(x % 64, y % 64, 2082) - 0.5) * 3 + wave(u, v, 2, 1) * 0.6;
        return [254 + n, 254 + n, 254 + n];
      },
    ],
    [
      "oak-grain",
      (u, v) => {
        const bend = 0.018 * wave(u, v, 1, 2);
        const grain =
          Math.sin(tau * (u * 22 + bend)) * 7 +
          Math.sin(tau * (u * 7 - bend)) * 5 +
          wave(u, v, 2, 1) * 2;
        return [250 + grain, 250 + grain, 250 + grain];
      },
    ],
    [
      "felt-grain",
      (u, v, x, y) => {
        const fibre =
          (noise(x % 64, y % 64, 2089) - 0.5) * 9 + wave(u, v, 37, 31) * 2;
        return [251 + fibre, 251 + fibre, 251 + fibre];
      },
    ],
    [
      "woven-grain",
      (u, v, x, y) => {
        const weave = wave(u, v, 32, 0) * wave(u, v, 0, 32) * 4;
        const fleck = (noise(x % 64, y % 64, 2083) - 0.5) * 3;
        return [251 + weave + fleck, 251 + weave + fleck, 251 + weave + fleck];
      },
    ],
    [
      "screen-grain",
      (u, v, x, y) => {
        const weave = wave(u, v, 32, 0) * wave(u, v, 0, 32) * 1.4;
        const fleck = (noise(x % 64, y % 64, 2083) - 0.5) * 0.6;
        return [253 + weave + fleck, 253 + weave + fleck, 253 + weave + fleck];
      },
    ],
    [
      "tile-grain",
      (u, v, x, y) => {
        const fleck =
          (noise(x % 64, y % 64, 2084) - 0.5) * 5 + wave(u, v, 3, 2) * 2;
        return [253 + fleck, 253 + fleck, 253 + fleck];
      },
    ],
    [
      "worktop-grain",
      (u, v, x, y) => {
        const fleck =
          (noise(x % 64, y % 64, 2090) - 0.5) * 5 + wave(u, v, 11, 7) * 1.2;
        return [253 + fleck, 253 + fleck, 253 + fleck];
      },
    ],
    [
      "earth-grain",
      (u, v, x, y) => {
        const n =
          (noise(x % 64, y % 64, 2085) - 0.5) * 32 +
          wave(u, v, 4, 3) * 9 +
          wave(u, v, 9, -4) * 5;
        return [225 + n, 230 + n, 215 + n];
      },
    ],
    [
      "paving-grain",
      (u, v, x, y) => {
        const n =
          (noise(x % 64, y % 64, 2086) - 0.5) * 12 + wave(u, v, 3, 2) * 3;
        return [242 + n, 242 + n, 240 + n];
      },
    ],
  ];
  return recipes.map(([id, sample]) => {
    const size = [
      "limestone-grain",
      "felt-grain",
      "tile-grain",
      "worktop-grain",
    ].includes(id)
      ? 512
      : id === "oak-grain"
        ? 1024
        : 256;
    const rgba = [];
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const u = x / size,
          v = y / size;
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
const crc = (bytes: Buffer) => {
  let c = 0xffffffff;
  for (const b of bytes) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (name: string, data: Buffer) => {
  const body = Buffer.concat([Buffer.from(name), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc(body));
  return Buffer.concat([length, body, checksum]);
};
function png(asset: { width: number; height: number; rgba: number[] }) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(asset.width, 0);
  header.writeUInt32BE(asset.height, 4);
  header[8] = 8;
  header[9] = 6;
  const rows = [];
  for (let y = 0; y < asset.height; y++)
    rows.push(
      Buffer.from([0]),
      Buffer.from(
        asset.rgba.slice(y * asset.width * 4, (y + 1) * asset.width * 4),
      ),
    );
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

if (require.main === module) {
  const directory = resolve("public/textures");
  mkdirSync(directory, { recursive: true });
  for (const asset of makeTextureAssets())
    writeFileSync(resolve(directory, asset.id + ".png"), png(asset));
}
