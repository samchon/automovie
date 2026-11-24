import type { IAutoMovieRandom } from "@automovie/interface";

/**
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
 *
 * @param random The stream, keyed by the caller's stable ids.
 * @param u Normalized time within the window, in [0, 1]; outside is zero.
 * @param duration The window's length, seconds, which sets the frequencies'
 *   time scale.
 * @param maxFrequency The highest frequency, hertz; positive.
 * @param terms Number of sines; 4 by default.
 * @returns The value, roughly in [-1, 1].
 */
export function seededSmoothNoise(
  random: IAutoMovieRandom,
  u: number,
  duration: number,
  maxFrequency: number,
  terms: number = 4,
): number {
  admit(duration, maxFrequency, terms);
  if (!(u > 0 && u < 1)) return 0;
  let sum: number = 0;
  for (let k: number = 0; k < terms; k++) {
    const frequency: number = maxFrequency * (0.3 + 0.7 * random.float(2 * k));
    const phase: number = 2 * Math.PI * random.float(2 * k + 1);
    sum += oscillation(2 * Math.PI * frequency, phase, u, duration);
  }
  return windowed(sum, u, Math.sqrt(terms));
}

/**
 * Explicit fixed-window spectrum preparation for repeated motion reads. The
 * ordinary function remains the direct one-shot evaluation.
 */
export namespace seededSmoothNoise {
  /**
   * Bind one pure indexed stream and fixed window. Parameter admission stays at
   * the first read, including an endpoint; endpoints/outside/NaN consume no
   * draws. The first interior read draws indices 0..2*terms-1 in their original
   * order and copies the exact angular rates and phases.
   *
   * Each later interior read uses the original left-associated rate_u_duration
   * expression, term addition order, polynomial window and normalization. It
   * performs every sine evaluation, keeps no time/output history and returns an
   * independent number. Releasing the reader releases its O(T) spectrum and
   * fixed stream reference.
   *
   * @param random The same pure counter-based stream used by direct reads.
   * @param duration Fixed window seconds, with the direct entry's domain.
   * @param maxFrequency Fixed highest frequency in hertz.
   * @param terms Fixed positive safe-integer term count, four by default.
   * @returns A reader of normalized time with the direct function's behavior.
   * @throws {Error} On the first read when the fixed parameters are invalid.
   */
  export function prepare(
    random: IAutoMovieRandom,
    duration: number,
    maxFrequency: number,
    terms: number = 4,
  ): (u: number) => number {
    let admitted: boolean = false;
    let spectrum: ISpectrum | undefined;
    return (u: number): number => {
      if (!admitted) {
        admit(duration, maxFrequency, terms);
        admitted = true;
      }
      if (!(u > 0 && u < 1)) return 0;
      if (spectrum === undefined) {
        const rates: number[] = [];
        const phases: number[] = [];
        for (let k: number = 0; k < terms; ++k) {
          const frequency: number =
            maxFrequency * (0.3 + 0.7 * random.float(2 * k));
          rates.push(2 * Math.PI * frequency);
          phases.push(2 * Math.PI * random.float(2 * k + 1));
        }
        spectrum = { rates, phases, normalizer: Math.sqrt(terms) };
      }
      let sum: number = 0;
      for (let k: number = 0; k < terms; ++k)
        sum += oscillation(
          spectrum.rates[k]!,
          spectrum.phases[k]!,
          u,
          duration,
        );
      return windowed(sum, u, spectrum.normalizer);
    };
  }
}

/** Copied spectral inputs; no current or previous motion value is stored. */
interface ISpectrum {
  /** Exact 2_pi_frequency products in original term order, radians/second. */
  rates: readonly number[];

  /** Exact indexed phase products in original term order, radians. */
  phases: readonly number[];

  /** The direct function's square root of the term count. */
  normalizer: number;
}

/** Keep the direct entry's parameter domain and first-read refusal text. */
function admit(duration: number, maxFrequency: number, terms: number): void {
  if (!(duration > 0) || !(maxFrequency > 0) || !(terms > 0))
    throw new Error(
      "Smooth noise needs a positive duration, frequency and term count",
    );
}

/** Preserve the original multiplication grouping for every actual term. */
function oscillation(
  rate: number,
  phase: number,
  u: number,
  duration: number,
): number {
  return Math.sin(rate * u * duration + phase);
}

/** One owner of the original contact-preserving window and normalization. */
function windowed(sum: number, u: number, normalizer: number): number {
  const bump: number = 16 * u * u * (1 - u) * (1 - u);
  return (bump * bump * sum) / normalizer;
}
