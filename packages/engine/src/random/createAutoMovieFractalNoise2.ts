import type { IAutoMovieRandom } from "@automovie/interface";

import { admitAutoMovieNoiseCoordinate } from "./admitAutoMovieNoiseCoordinate";
import { admitAutoMovieNoiseOctaves } from "./admitAutoMovieNoiseOctaves";
import { createAutoMovieGradientNoise2 } from "./createAutoMovieGradientNoise2";
import { createAutoMovieRandom } from "./createAutoMovieRandom";

/**
 * Seeded two-dimensional fractal noise in [-1, 1]: a sum of octaves of
 * {@link createAutoMovieGradientNoise2}, the sum of scaled octaves Perlin
 * describes (Perlin 1985, "An Image Synthesizer", SIGGRAPH Computer Graphics
 * 19(3)).
 *
 * Octave `o` (from 0) samples its own gradient lattice at `2^o` times the point
 * with amplitude `roughness^o`, and the sum is divided by the sum of the
 * amplitudes. Each octave lies in [-1, 1], so the normalized sum does too, and
 * it keeps the continuity of every octave. Octave 0 uses `seed` itself, so one
 * octave equals the single-octave noise; octave `o >= 1` uses the stream
 * derived from `seed` by the ids `"octave"` and `o`, which decorrelates the
 * octaves, all of which would otherwise vanish together at the origin.
 *
 * The domain bound applies at the finest octave: a coordinate is admitted when
 * `|coordinate| * 2^(octaves - 1)` is at most
 * {@link createAutoMovieGradientNoise2.BOUND}.
 *
 * @param seed Sixteen hexadecimal digits, as `deriveAutoMovieSeed` returns.
 * @param octaves Number of octaves, a positive integer.
 * @param roughness Amplitude ratio between successive octaves, in (0, 1).
 * @returns The noise, taking plan coordinates in first-octave lattice cells; it
 *   throws naming `x` or `y` when a coordinate is not finite or its finest
 *   octave coordinate exceeds the bound.
 * @throws {Error} Naming `octaves` or `roughness` when either is outside its
 *   range, or when `seed` is not sixteen hexadecimal digits.
 */
export function createAutoMovieFractalNoise2(
  seed: string,
  octaves: number,
  roughness: number,
): (x: number, y: number) => number {
  admitAutoMovieNoiseOctaves(octaves, roughness);
  const base: IAutoMovieRandom = createAutoMovieRandom(seed);
  const layers: ((x: number, y: number) => number)[] = [];
  let total: number = 0;
  for (let o: number = 0, amplitude: number = 1; o < octaves; ++o) {
    layers.push(
      createAutoMovieGradientNoise2(
        o === 0 ? base.seed : base.stream("octave", String(o)).seed,
      ),
    );
    total += amplitude;
    amplitude *= roughness;
  }
  const finest: number = 2 ** (octaves - 1);
  const bound: number = createAutoMovieGradientNoise2.BOUND;
  return (x: number, y: number): number => {
    admitAutoMovieNoiseCoordinate("x", x, finest, bound);
    admitAutoMovieNoiseCoordinate("y", y, finest, bound);
    let sum: number = 0;
    let frequency: number = 1;
    let amplitude: number = 1;
    for (const layer of layers) {
      sum += amplitude * layer(x * frequency, y * frequency);
      frequency *= 2;
      amplitude *= roughness;
    }
    return Math.max(-1, Math.min(1, sum / total));
  };
}
