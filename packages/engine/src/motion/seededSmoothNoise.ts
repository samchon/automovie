import type { IAutoMovieRandom } from "../random/IAutoMovieRandom";

/**
 * Smooth, seeded, band-limited variation over one window of an action, zero
 * with zero first and second derivatives at both ends.
 *
 * The signal is a sum of `terms` sines whose frequencies (uniform in
 * `[0.3, 1] * maxFrequency` hertz) and phases are drawn from the stream, each
 * weighted `1 / sqrt(terms)`, the procedural-noise construction of Perlin and
 * Goldberg's Improv (SIGGRAPH 1996) used for idle and path variation. It is
 * multiplied by the window `w(u) = (16 u^2 (1 - u)^2)^2`, which is 1 at the
 * middle and vanishes with its first three derivatives at `u = 0` and `u = 1`,
 * so variation added to a motion leaves its contacts, its cut points and its
 * continuity untouched. The draws read stream indices `0 .. 2 terms - 1`, so
 * the same stream always yields the same signal.
 *
 * @param random The stream, keyed by the caller's stable ids.
 * @param u Normalized time within the window, in [0, 1]; outside is zero.
 * @param duration The window's length, seconds, which sets the frequencies' time scale.
 * @param maxFrequency The highest frequency, hertz; positive.
 * @param terms Number of sines; 4 by default.
 * @returns The value, roughly in [-1, 1].
 *
 * @evidence contracts/development/common.md#meaningful-documentation Cites the construction, states the window's boundary property, the draw indices and the value range.
 * @evidence contracts/development/implementation.md#principled-implementation A seeded sum of sines (Perlin and Goldberg 1996) under a polynomial window whose derivatives vanish at the ends.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over terms, then the window.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Non-positive durations, frequencies or term counts throw.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the term count.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function seededSmoothNoise(
  random: IAutoMovieRandom,
  u: number,
  duration: number,
  maxFrequency: number,
  terms: number = 4,
): number {
  if (
    !(duration > 0) ||
    !(maxFrequency > 0) ||
    !(Number.isSafeInteger(terms) && terms > 0)
  )
    throw new Error(
      "Smooth noise needs a positive duration, frequency and term count",
    );
  if (!(u > 0 && u < 1)) return 0;
  let sum: number = 0;
  for (let k: number = 0; k < terms; k++) {
    const frequency: number = maxFrequency * (0.3 + 0.7 * random.float(2 * k));
    const phase: number = 2 * Math.PI * random.float(2 * k + 1);
    sum += Math.sin(2 * Math.PI * frequency * u * duration + phase);
  }
  const bump: number = 16 * u * u * (1 - u) * (1 - u);
  return (bump * bump * sum) / Math.sqrt(terms);
}
