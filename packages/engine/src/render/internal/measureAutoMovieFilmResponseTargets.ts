import { AUTOMOVIE_FILM_GLARE_KERNELS } from "../AUTOMOVIE_FILM_GLARE_KERNELS";

/**
 * The GPU targets one film response stage allocates at a `width × height` pixel
 * raster, as render's `allocateAutoMovieFilmTargets` makes them.
 *
 * The linear half-float target and its depth texture at the raster; the glare
 * pyramid, one half-float level per halving down to the deepest kernel's level
 * `max(0, ⌊log₂(σ × height / 2)⌋)`, each side rounded up; and two half-float
 * blur targets per kernel at its level. The stage makes all of them whether or
 * not glare is asked for. Each target and the depth texture is one texture
 * allocation. The film's beauty stage and every surface feed drawn through the
 * film's optics hold one such stage each.
 *
 * @param width Raster width in pixels, positive.
 * @param height Raster height in pixels, positive.
 * @returns The stage's allocations and their bytes.
 */
export function measureAutoMovieFilmResponseTargets(
  width: number,
  height: number,
): {
  /** Texture allocations the stage holds. */
  targets: number;

  /** Bytes those allocations hold. */
  bytes: number;
} {
  const levelSize: (at: number) => number = (at: number): number =>
    Math.max(1, Math.ceil(width / 2 ** at)) *
    Math.max(1, Math.ceil(height / 2 ** at));
  const levels: number[] = AUTOMOVIE_FILM_GLARE_KERNELS.map(
    (kernel: { sigma: number }): number =>
      Math.max(0, Math.floor(Math.log2((kernel.sigma * height) / 2))),
  );
  const deepest: number = Math.max(...levels);
  let pyramid: number = 0;
  for (let at: number = 1; at <= deepest; ++at) pyramid += levelSize(at) * HALF;
  const kernels: number = levels.reduce(
    (sum: number, at: number): number => sum + 2 * levelSize(at) * HALF,
    0,
  );
  return {
    targets: 2 + deepest + 2 * levels.length,
    bytes: width * height * (HALF + DEPTH) + pyramid + kernels,
  };
}

/** Bytes of one RGBA half-float texel. */
const HALF: number = 8;

/**
 * Bytes of one depth texel: three.js's default depth texture holds 24 bits in a
 * 32-bit word.
 */
const DEPTH: number = 4;
