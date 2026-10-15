import { encodeAutoMoviePng } from "@automovie/engine";
import { IAutoMovieImage } from "@automovie/interface";

/**
 * Paint the strand atlas every hair, brow and lash card samples: coverage in alpha and per-strand brightness in grey, which the hair material's colour tints.
 *
 * A card stands for a lock of parallel strands, the "base texture for the fine structure of a hair bundle" with an opacity map that breaks up its outline of Scheuermann (2004, "Practical Real-Time Hair Rendering and Shading", SIGGRAPH sketch). Each strand is a band of smooth cross-section running from the root at texture `y = 0`, the first image row, to its own tip, tapering over the last part of its length; neighbouring strands overlap, differ in brightness and end at different lengths, so the card's outline is ragged and its colour streaked along the strand as hair is. Columns, as {@link paintAutoMovieHumanHairStrands.COLUMNS} lists them: four lock variants for scalp hair, one lone strand for brow hairs, a cluster of three lashes, and an opaque band for the scalp cap. Positions, widths and lengths come from an integer hash, so the image is the same in every run and on every platform. Sizes are in texels and chosen to read as hair at face scale; grade: conventional.
 *
 * @returns The atlas, RGBA, id `human.hair.strands`
 */
export function paintAutoMovieHumanHairStrands(): IAutoMovieImage {
  const pixels: Uint8Array = new Uint8Array(WIDTH * HEIGHT * 4);
  const C = paintAutoMovieHumanHairStrands.COLUMNS;
  for (let k: number = 0; k < 4; ++k) lock(pixels, C.locks[k]!, 15, 0.7, 2.6, k);
  lock(pixels, C.single, 1, 1, 13, 10);
  lock(pixels, C.lashes, 3, 0.8, 5, 11);
  for (let y: number = 0; y < HEIGHT; ++y)
    for (let x: number = Math.ceil(C.solid[0] * WIDTH); x < WIDTH; ++x) {
      const at: number = 4 * (y * WIDTH + x);
      pixels.fill(200, at, at + 3);
      pixels[at + 3] = 255;
    }
  return {
    id: "human.hair.strands",
    mimeType: "image/png",
    data: encodeAutoMoviePng({ width: WIDTH, height: HEIGHT, channels: 4, pixels }),
  };
}
/**
 * Layout of the strand atlas.
 */
export namespace paintAutoMovieHumanHairStrands {
  /** Texture `x` ranges of the atlas columns. */
  export const COLUMNS = {
    /** Four variants of a lock of scalp hair. */
    locks: [
      [0, 0.1875],
      [0.1875, 0.375],
      [0.375, 0.5625],
      [0.5625, 0.75],
    ] as ReadonlyArray<readonly [number, number]>,

    /** One strand, centred, for brow hairs. */
    single: [0.75, 0.8125] as readonly [number, number],

    /** Three lashes side by side. */
    lashes: [0.8125, 0.9375] as readonly [number, number],

    /** Opaque, for the scalp cap. */
    solid: [0.953125, 1] as readonly [number, number],
  };
}

/** Atlas size, texels. */
const WIDTH: number = 256;
const HEIGHT: number = 256;

/** Paint a lock of strands into one column: count, shortest tip as a share of the column's height, strand width in texels and a seed. */
function lock(
  pixels: Uint8Array,
  column: readonly [number, number],
  count: number,
  shortest: number,
  width: number,
  seed: number,
): void {
  const x0: number = column[0] * WIDTH;
  const span: number = (column[1] - column[0]) * WIDTH;
  for (let s: number = 0; s < count; ++s) {
    const centre: number =
      count === 1 ? x0 + span / 2 : x0 + 1.5 + ((s + 0.5 + 0.8 * (hash(seed, s, 0) - 0.5)) / count) * (span - 3);
    const half: number = (width * (0.75 + 0.5 * hash(seed, s, 1))) / 2;
    const tip: number = shortest + (1 - shortest) * hash(seed, s, 2);
    const shade: number = 0.72 + 0.28 * hash(seed, s, 3);
    const sway: number = (hash(seed, s, 4) - 0.5) * 1.2;
    for (let y: number = 0; y < HEIGHT; ++y) {
      const t: number = (y + 0.5) / HEIGHT;
      if (t > tip) break;
      const taper: number = Math.min(1, (tip - t) / (0.25 * tip));
      const c: number = centre + sway * t * t * half * 2;
      const h: number = Math.max(0.5, half * (0.35 + 0.65 * taper));
      for (let x: number = Math.floor(c - h - 1); x <= Math.ceil(c + h + 1); ++x) {
        if (x < x0 || x >= x0 + span) continue;
        const d: number = Math.abs(x + 0.5 - c) / (h + 0.5);
        if (d >= 1) continue;
        const alpha: number = (1 - d * d) * (0.55 + 0.45 * taper);
        const at: number = 4 * (y * WIDTH + x);
        if (alpha * 255 <= pixels[at + 3]!) continue;
        // roots a little darker, where the strand leaves the shade of the lock
        const grey: number = 255 * shade * (0.82 + 0.18 * Math.min(1, t / 0.3));
        pixels.fill(Math.round(grey), at, at + 3);
        pixels[at + 3] = Math.round(255 * alpha);
      }
    }
  }
}

/** Integer hash to `[0, 1)`, a 32-bit avalanche mix. */
function hash(seed: number, i: number, k: number): number {
  let h: number = Math.imul(seed + 1, 0x27d4eb2d) ^ Math.imul(i + 1, 0x165667b1) ^ Math.imul(k + 1, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
