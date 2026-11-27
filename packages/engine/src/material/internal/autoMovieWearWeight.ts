import type {
  IAutoMovieMaterialWear,
  IAutoMovieVector3,
} from "@automovie/interface";

import { autoMovieProceduralFractal } from "./autoMovieProceduralFractal";

/**
 * One wear layer's weight at a point: the CPU reference of the worn material's
 * fragment shader.
 *
 * `smoothstep(1 − amount, 1, clamp(1 − distance / width, 0, 1)) × n`, where `n
 * = 0.5 + 0.5 × autoMovieProceduralFractal(seed, point / width)` is the
 * procedural surfaces' four-octave noise at the bind-pose point, in lattice
 * cells one layer width wide, so breakup patches are about as wide as the band
 * they interrupt. The weight is zero at and beyond `width` from the edge and at
 * most `n` on it.
 *
 * @param layer The admitted layer.
 * @param distance Metres from the point to the nearest feature edge of the
 *   layer's sign.
 * @param seed The wear record's seed.
 * @param point The bind-pose object-space point, metres.
 * @returns The weight within [0, 1].
 */
export function autoMovieWearWeight(
  layer: IAutoMovieMaterialWear.ILayer,
  distance: number,
  seed: number,
  point: IAutoMovieVector3,
): number {
  const band: number = Math.max(0, Math.min(1, 1 - distance / layer.width));
  const low: number = 1 - layer.amount;
  const t: number = Math.max(0, Math.min(1, (band - low) / (1 - low)));
  const noise: number =
    0.5 +
    0.5 *
      autoMovieProceduralFractal(
        seed,
        point.x / layer.width,
        point.y / layer.width,
        point.z / layer.width,
      );
  return t * t * (3 - 2 * t) * noise;
}
