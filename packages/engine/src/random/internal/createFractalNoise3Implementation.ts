import type { IAutoMovieRandom } from "@automovie/interface";

import { admitNoiseCoordinate } from "./admitNoiseCoordinate";
import { admitNoiseOctaves } from "./admitNoiseOctaves";
import { createGradientNoise3Implementation } from "./createGradientNoise3Implementation";
import { createRandomImplementation } from "./createRandomImplementation";
import { AutoMovieEngineRandomBounds } from "./AutoMovieEngineRandomBounds";

/*
 * Seeded three-dimensional fractal noise in [-1, 1]: a sum of octaves of
 * createGradientNoise3Implementation, built as `createFractalNoise2Implementation`
 * builds its sum (Perlin 1985, "An Image Synthesizer", SIGGRAPH Computer
 * Graphics 19(3)).
 *
 * Octave `o` (from 0) samples its own lattice at `2^o` times the point with
 * amplitude `roughness^o`, and the sum is divided by the sum of the amplitudes,
 * so it stays in [-1, 1] and keeps every octave's continuity. Octave 0 uses
 * `seed`; octave `o >= 1` uses the stream derived from `seed` by the ids
 * `"octave"` and `o`. A coordinate is admitted when its magnitude times
 * `2^(octaves-1)` is at most AutoMovieEngineRandom.GRADIENT_NOISE_3_BOUND.
 * Parameter seed: Sixteen hexadecimal digits, as `deriveSeedValue` returns.
 * Parameter octaves: Number of octaves, a positive integer.
 * Parameter roughness: Amplitude ratio between successive octaves, in (0, 1).
 * Returns: The noise, taking coordinates in first-octave lattice cells; it
 * throws naming `x`, `y` or `z` when a coordinate is not finite or its finest
 * octave coordinate exceeds the bound.
 * Naming `octaves` or `roughness` when either is outside its
 * range, or when `seed` is not sixteen hexadecimal digits.
 */
export function createFractalNoise3Implementation(
  seed: string,
  octaves: number,
  roughness: number,
): (x: number, y: number, z: number) => number {
  admitNoiseOctaves(octaves, roughness);
  const base: IAutoMovieRandom = createRandomImplementation(seed);
  const layers: ((x: number, y: number, z: number) => number)[] = [];
  let total: number = 0;
  for (let o: number = 0, amplitude: number = 1; o < octaves; ++o) {
    layers.push(
      createGradientNoise3Implementation(
        o === 0 ? base.seed : base.stream("octave", String(o)).seed,
      ),
    );
    total += amplitude;
    amplitude *= roughness;
  }
  const finest: number = 2 ** (octaves - 1);
  const bound: number = AutoMovieEngineRandomBounds.GRADIENT_NOISE_3;
  return (x: number, y: number, z: number): number => {
    admitNoiseCoordinate("x", x, finest, bound);
    admitNoiseCoordinate("y", y, finest, bound);
    admitNoiseCoordinate("z", z, finest, bound);
    let sum: number = 0;
    let frequency: number = 1;
    let amplitude: number = 1;
    for (const layer of layers) {
      sum += amplitude * layer(x * frequency, y * frequency, z * frequency);
      frequency *= 2;
      amplitude *= roughness;
    }
    return Math.max(-1, Math.min(1, sum / total));
  };
}
