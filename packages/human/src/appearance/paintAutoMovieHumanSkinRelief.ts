import { encodeAutoMoviePng } from "@automovie/engine";
import { IAutoMovieImage } from "@automovie/interface";

/**
 * Paint the skin's micro-relief, pores and the fine furrow network, as one seamlessly tiling tangent-space normal map.
 *
 * Relief comes from Worley's cellular basis (1996, SIGGRAPH '96, pp. 291-294): space is cut into cells, each holding feature points from a hash of its integer address, so the texture needs no table and is the same in every run and on every platform. Two fields of it make the height:
 *
 * - Pores: a pit of Gaussian profile at every feature point of a fine field, about one pore per 0.62 mm square cell, with radius jittered per pore.
 * - Furrows: the edges of a coarser field, where the distances to the nearest and the second nearest feature point are equal, which cut the skin into the irregular polygonal plateaus of the surface's primary lines; their depth grows with `furrows`.
 *
 * No measured pore density, pore diameter or furrow depth was read, so sizes and depths are conventional values chosen to read as skin at face scale. Cell addresses wrap at the tile's edge, so the tile repeats without a seam. The normal is the height's gradient in texel units, X along +u and Y along +v, encoded from `[-1, 1]` to `[0, 255]`, which is the tangent frame the viewer derives from the texture coordinates.
 *
 * @param props.furrows Depth of the furrow network from faint (0) to deep (1), dimensionless
 * @returns The normal image, linear RGB, its id naming the depth so images of equal content share it
 */
export function paintAutoMovieHumanSkinRelief(props: {
  furrows: number;
}): IAutoMovieImage {
  const N: number = SIZE;
  // quantized to hundredths, so the id names the content exactly
  const furrows: number = Math.round(props.furrows * 100) / 100;
  const height: Float64Array = new Float64Array(N * N);
  for (let y: number = 0; y < N; ++y)
    for (let x: number = 0; x < N; ++x) {
      const pore: number = poreDepth(x, y);
      const furrow: number = furrowDepth(x, y);
      height[y * N + x] = -pore - (0.25 + 0.5 * furrows) * furrow;
    }
  const pixels: Uint8Array = new Uint8Array(N * N * 3);
  for (let y: number = 0; y < N; ++y)
    for (let x: number = 0; x < N; ++x) {
      const h = (i: number, j: number): number =>
        height[((j + N) % N) * N + ((i + N) % N)]!;
      const dx: number = (h(x + 1, y) - h(x - 1, y)) / 2;
      const dy: number = (h(x, y + 1) - h(x, y - 1)) / 2;
      const nx: number = -dx * RELIEF;
      const ny: number = -dy * RELIEF;
      const length: number = Math.hypot(nx, ny, 1);
      const at: number = 3 * (y * N + x);
      pixels[at] = Math.round(127.5 * (nx / length + 1));
      pixels[at + 1] = Math.round(127.5 * (ny / length + 1));
      pixels[at + 2] = Math.round(127.5 * (1 / length + 1));
    }
  return {
    id: `human.skin.relief.${Math.round(furrows * 100)}`,
    mimeType: "image/png",
    data: encodeAutoMoviePng({ width: N, height: N, channels: 3, pixels }),
  };
}
/** The tile scale {@link paintAutoMovieHumanSkinRelief} paints at, which the skin material repeats it by. */
/**
 * Types and constants of {@link paintAutoMovieHumanSkinRelief}.
 */
export namespace paintAutoMovieHumanSkinRelief {
  /** Skin length one tile spans, metres; the material repeats the tile at this scale. */
  export const TILE: number = 0.02;
}

/** Edge of the tile, texels. */
const SIZE: number = 256;

/** Pore cells per tile edge: 0.62 mm cells, about 260 pores per square centimetre; conventional. */
const PORE_CELLS: number = 32;

/** Furrow cells per tile edge: 1 mm plateaus, the scale of the skin's primary lines; conventional. */
const FURROW_CELLS: number = 20;

/** Slope gain from height units per texel to the normal's tilt. */
const RELIEF: number = 1.0;

/** Depth of a pore pit at a texel, height units. */
function poreDepth(x: number, y: number): number {
  const cell: number = SIZE / PORE_CELLS;
  const cx: number = Math.floor(x / cell);
  const cy: number = Math.floor(y / cell);
  let depth: number = 0;
  for (let j: number = -1; j <= 1; ++j)
    for (let i: number = -1; i <= 1; ++i) {
      const [px, py, r] = feature(cx + i, cy + j, PORE_CELLS, 1);
      const dx: number = x - (cx + i + px) * cell;
      const dy: number = y - (cy + j + py) * cell;
      const radius: number = (0.9 + 0.9 * r) * (cell / 8);
      depth = Math.max(
        depth,
        Math.exp(-(dx * dx + dy * dy) / (2 * radius * radius)),
      );
    }
  return depth;
}

/** Depth of the furrow network at a texel, height units: one on a cell edge, falling to zero over about a texel and a half. */
function furrowDepth(x: number, y: number): number {
  const cell: number = SIZE / FURROW_CELLS;
  const cx: number = Math.floor(x / cell);
  const cy: number = Math.floor(y / cell);
  let first: number = Infinity;
  let second: number = Infinity;
  for (let j: number = -2; j <= 2; ++j)
    for (let i: number = -2; i <= 2; ++i) {
      const [px, py] = feature(cx + i, cy + j, FURROW_CELLS, 2);
      const d: number = Math.hypot(
        x - (cx + i + px) * cell,
        y - (cy + j + py) * cell,
      );
      if (d < first) {
        second = first;
        first = d;
      } else if (d < second) second = d;
    }
  const gap: number = (second - first) / 2;
  return Math.exp(-(gap * gap) / (2 * 1.5 * 1.5));
}

/** Feature point of a wrapped cell, its offset within the cell and a third random value, all in `[0, 1)`. */
function feature(
  i: number,
  j: number,
  cells: number,
  seed: number,
): [number, number, number] {
  const wi: number = ((i % cells) + cells) % cells;
  const wj: number = ((j % cells) + cells) % cells;
  return [hash(wi, wj, seed, 0), hash(wi, wj, seed, 1), hash(wi, wj, seed, 2)];
}

/** Integer hash of a cell address to `[0, 1)`, a 32-bit avalanche mix. */
function hash(i: number, j: number, seed: number, k: number): number {
  let h: number =
    Math.imul(i, 0x27d4eb2d) ^
    Math.imul(j, 0x165667b1) ^
    Math.imul(seed * 4 + k, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
