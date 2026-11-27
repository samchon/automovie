import type { IAutoMovieRandom } from "@automovie/interface";
import { SeededSmoothNoiseInternal } from "./SeededSmoothNoiseInternal";

/*
 * Smooth, seeded, band-limited variation over one window of an action, zero
 * with zero first and second derivatives at both ends.
 *
 * The signal is a sum of `terms` sines whose frequencies (uniform in `[0.3, 1]
 *
 * - MaxFrequency`hertz) and phases are drawn from the stream, each weighted`1 /
 *   sqrt(terms)`, the procedural-noise construction of Perlin and Goldberg's
 *   Improv (SIGGRAPH 1996) used for idle and path variation. It is multiplied
 *   by the window `w(u) = (16 u^2 (1 - u)^2)^2`, which is 1 at the middle and
 *   vanishes with its first three derivatives at `u = 0`and`u = 1`, so
 *   variation added to a motion leaves its contacts, its cut points and its
 *   continuity untouched. The draws read stream indices `0 .. 2 terms - 1`, so
 *   the same stream always yields the same signal.
 * Parameter random: The stream, keyed by the caller's stable ids.
 * Parameter u: Normalized time within the window, in [0, 1]; outside is zero.
 * Parameter duration: The window's length, seconds, which sets the frequencies'
 * time scale.
 * Parameter maxFrequency: The highest frequency, hertz; positive.
 * Parameter terms: Number of sines; 4 by default.
 * Returns: The value, roughly in [-1, 1].
 */
export function seededSmoothNoise(
  random: IAutoMovieRandom,
  u: number,
  duration: number,
  maxFrequency: number,
  terms: number = 4,
): number {
  SeededSmoothNoiseInternal.admit(duration, maxFrequency, terms);
  if (!(u > 0 && u < 1)) return 0;
  let sum: number = 0;
  for (let k: number = 0; k < terms; k++) {
    const frequency: number = maxFrequency * (0.3 + 0.7 * random.float(2 * k));
    const phase: number = 2 * Math.PI * random.float(2 * k + 1);
    sum += SeededSmoothNoiseInternal.oscillation(
      2 * Math.PI * frequency,
      phase,
      u,
      duration,
    );
  }
  return SeededSmoothNoiseInternal.windowed(sum, u, Math.sqrt(terms));
}
