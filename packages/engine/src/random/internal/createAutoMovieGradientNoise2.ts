import type { IAutoMovieRandom } from "@automovie/interface";

import { admitAutoMovieNoiseCoordinate } from "./admitAutoMovieNoiseCoordinate";
import { createAutoMovieRandom } from "./createAutoMovieRandom";
import { fadeAutoMovieGradientNoise } from "./fadeAutoMovieGradientNoise";
import { AutoMovieEngineRandomBounds } from "./AutoMovieEngineRandomBounds";

/*
 * Seeded two-dimensional gradient noise, a smooth non-periodic value over the
 * plane in [-1, 1].
 *
 * The construction is Perlin's gradient lattice (Perlin 1985, "An Image
 * Synthesizer", SIGGRAPH Computer Graphics 19(3)): each integer lattice corner
 * carries a unit gradient, the value at a point blends the four corners' dot
 * products of gradient and offset, and the blend uses the quintic fade of
 * Perlin 2002 (fadeAutoMovieGradientNoise). The value is therefore zero
 * at every lattice corner and continuous with continuous first and second
 * derivatives everywhere.
 *
 * A corner's gradient is read from the counter stream of `seed`
 * (createAutoMovieRandom) at the corner's own index, so no permutation
 * table and no short period exist, and the value depends only on the seed and
 * the point. Corner `(i, j)` reads index `(i + B) N + (j + B)` with `B = 2^25`
 * (AutoMovieEngineRandom.GRADIENT_NOISE_2_BOUND) and `N = 2B + 2`. A point
 * admitted by the bound has corners in `[-B, B + 1]` on each axis, so both
 * digits lie in `[0, N)` and the mixed-radix index is one-to-one, with largest
 * value `N^2 - 1 < 2^53`, a nonnegative safe integer the stream holds.
 *
 * Bound: the fade weights of the four corners are nonnegative and sum to one,
 * and the gradients are unit vectors, so by Jensen's inequality the raw value
 * is at most `sqrt(sum w |p-c|^2)`. Per axis that sum is `(1-s)t^2+s(1-t)^2`,
 * at most `t(1-t) <= 1/4`, because the fade `s` lies at or below `t` on `[0,
 * 1/2]` and is symmetric. The raw value is thus at most `sqrt(2) / 2`, attained
 * at a cell centre when every gradient points at it, and the output is the raw
 * value times `2 / sqrt(2)`, clamped to [-1, 1] only to absorb rounding.
 * Parameter seed: Sixteen hexadecimal digits, as `deriveAutoMovieSeed` returns.
 * Returns: The noise, taking plan coordinates in lattice cells; it throws
 * naming `x` or `y` when a coordinate is not finite or exceeds `짹B`.
 */
export function createAutoMovieGradientNoise2(
  seed: string,
): (x: number, y: number) => number {
  const random: IAutoMovieRandom = createAutoMovieRandom(seed);
  const bound: number = AutoMovieEngineRandomBounds.GRADIENT_NOISE_2;
  const radix: number = 2 * bound + 2;

  // The dot product of corner (i, j)'s unit gradient with the offset (u, v)
  // from that corner; the gradient's angle is the corner's first 32-bit word.
  const corner: (i: number, j: number, u: number, v: number) => number = (
    i: number,
    j: number,
    u: number,
    v: number,
  ): number => {
    const angle: number =
      (random.uint32((i + bound) * radix + (j + bound)) / 4294967296) *
      2 *
      Math.PI;
    return Math.cos(angle) * u + Math.sin(angle) * v;
  };
  return (x: number, y: number): number => {
    admitAutoMovieNoiseCoordinate("x", x, 1, bound);
    admitAutoMovieNoiseCoordinate("y", y, 1, bound);
    const i: number = Math.floor(x);
    const j: number = Math.floor(y);
    const u: number = x - i;
    const v: number = y - j;
    const su: number = fadeAutoMovieGradientNoise(u);
    const sv: number = fadeAutoMovieGradientNoise(v);
    const n00: number = corner(i, j, u, v);
    const n10: number = corner(i + 1, j, u - 1, v);
    const n01: number = corner(i, j + 1, u, v - 1);
    const n11: number = corner(i + 1, j + 1, u - 1, v - 1);
    const near: number = n00 + su * (n10 - n00);
    const far: number = n01 + su * (n11 - n01);
    const value: number = (near + sv * (far - near)) * Math.SQRT2;
    return Math.max(-1, Math.min(1, value));
  };
}

/*
 * The two-dimensional noise's domain bound.
 */
