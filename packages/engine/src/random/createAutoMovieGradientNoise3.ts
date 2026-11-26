import type { IAutoMovieRandom } from "@automovie/interface";

import { admitAutoMovieNoiseCoordinate } from "./admitAutoMovieNoiseCoordinate";
import { createAutoMovieRandom } from "./createAutoMovieRandom";
import { fadeAutoMovieGradientNoise } from "./fadeAutoMovieGradientNoise";
import { AutoMovieEngineRandomBounds } from "./AutoMovieEngineRandomBounds";

/**
 * Seeded three-dimensional gradient noise, a smooth non-periodic value over
 * space in [-1, 1].
 *
 * The construction is the three-dimensional form of
 * `createAutoMovieGradientNoise2`: Perlin's gradient lattice (Perlin 1985, "An
 * Image Synthesizer", SIGGRAPH Computer Graphics 19(3)) blended over the eight
 * corners of a cell by the quintic fade of Perlin 2002
 * ({@link fadeAutoMovieGradientNoise}). The value is zero at every lattice
 * corner and continuous with continuous first and second derivatives.
 *
 * A corner's unit gradient is read from the counter stream of `seed`
 * ({@link createAutoMovieRandom}) at the corner's own index, uniform over the
 * sphere by Archimedes' hat-box theorem (height uniform in [-1, 1], azimuth
 * uniform). Corner `(i, j, k)` reads index `((i + B) N + (j + B)) N + (k + B)`
 * with `B = 2^16` ({@link AutoMovieEngineRandom.GRADIENT_NOISE_3_BOUND}) and `N = 2B +
 * 2`. A point admitted by the bound has corners in `[-B, B + 1]` on each axis,
 * so every digit lies in `[0, N)` and the mixed-radix index is one-to-one, with
 * largest value `N^3 - 1`, about 2.25e15, below 2^53.
 *
 * Bound: as in two dimensions, nonnegative fade weights that sum to one and
 * unit gradients bound the raw value by `sqrt(sum w |p - c|^2)`, and each of
 * the three axes contributes at most 1/4, so the raw value is at most `sqrt(3)
 * / 2`. The output is the raw value times `2 / sqrt(3)`, clamped to [-1, 1]
 * only to absorb rounding.
 *
 * @param seed Sixteen hexadecimal digits, as `deriveAutoMovieSeed` returns.
 * @returns The noise, taking coordinates in lattice cells; it throws naming
 *   `x`, `y` or `z` when a coordinate is not finite or exceeds `짹B`.
 */
export function createAutoMovieGradientNoise3(
  seed: string,
): (x: number, y: number, z: number) => number {
  const random: IAutoMovieRandom = createAutoMovieRandom(seed);
  const bound: number = AutoMovieEngineRandomBounds.GRADIENT_NOISE_3;
  const radix: number = 2 * bound + 2;
  const scale: number = 2 / Math.sqrt(3);

  // The dot product of corner (i, j, k)'s unit gradient with the offset
  // (u, v, w) from it; the block's first word gives the gradient's height and
  // its second the azimuth.
  const corner: (
    i: number,
    j: number,
    k: number,
    u: number,
    v: number,
    w: number,
  ) => number = (
    i: number,
    j: number,
    k: number,
    u: number,
    v: number,
    w: number,
  ): number => {
    const block: [number, number, number, number] = random.block(
      ((i + bound) * radix + (j + bound)) * radix + (k + bound),
    );
    const height: number = 1 - (2 * block[0]) / 4294967296;
    const azimuth: number = (block[1] / 4294967296) * 2 * Math.PI;
    const ring: number = Math.sqrt(Math.max(0, 1 - height * height));
    return (
      ring * Math.cos(azimuth) * u + ring * Math.sin(azimuth) * v + height * w
    );
  };
  return (x: number, y: number, z: number): number => {
    admitAutoMovieNoiseCoordinate("x", x, 1, bound);
    admitAutoMovieNoiseCoordinate("y", y, 1, bound);
    admitAutoMovieNoiseCoordinate("z", z, 1, bound);
    const i: number = Math.floor(x);
    const j: number = Math.floor(y);
    const k: number = Math.floor(z);
    const u: number = x - i;
    const v: number = y - j;
    const w: number = z - k;
    const su: number = fadeAutoMovieGradientNoise(u);
    const sv: number = fadeAutoMovieGradientNoise(v);
    const sw: number = fadeAutoMovieGradientNoise(w);

    // Blend along x on each of the four edges, then along y, then along z.
    const edge: (dj: number, dk: number) => number = (
      dj: number,
      dk: number,
    ): number => {
      const a: number = corner(i, j + dj, k + dk, u, v - dj, w - dk);
      const b: number = corner(i + 1, j + dj, k + dk, u - 1, v - dj, w - dk);
      return a + su * (b - a);
    };
    const e00: number = edge(0, 0);
    const e10: number = edge(1, 0);
    const e01: number = edge(0, 1);
    const e11: number = edge(1, 1);
    const near: number = e00 + sv * (e10 - e00);
    const far: number = e01 + sv * (e11 - e01);
    const value: number = (near + sw * (far - near)) * scale;
    return Math.max(-1, Math.min(1, value));
  };
}

/** The three-dimensional noise's domain bound. */
