import { autoMovieProceduralNoise } from "./autoMovieProceduralNoise";

/**
 * Four octaves of `autoMovieProceduralNoise`, lacunarity 2 and gain 0.5, in
 * lattice units, normalized to [-1, 1].
 *
 * Octave `o` (0 to 3) samples the point times `2^o` with weight `0.5^o` under
 * salt `1 + o`, so the octaves use unrelated lattices; the weighted sum is
 * divided by the weights' total, 1.875, so the bound of each octave bounds the
 * sum. Plaster, clay, stone and brushed metal, and #4083's wear, read it.
 *
 * @param seed Unsigned 32-bit seed.
 * @returns The fractal sum at the lattice-unit point `(x, y, z)`.
 */
export function autoMovieProceduralFractal(
  seed: number,
  x: number,
  y: number,
  z: number,
): number {
  let sum: number = 0;
  let frequency: number = 1;
  let amplitude: number = 1;
  for (let octave: number = 0; octave < 4; ++octave) {
    sum +=
      amplitude *
      autoMovieProceduralNoise(
        seed,
        1 + octave,
        x * frequency,
        y * frequency,
        z * frequency,
      );
    frequency *= 2;
    amplitude *= 0.5;
  }
  return sum / 1.875;
}
