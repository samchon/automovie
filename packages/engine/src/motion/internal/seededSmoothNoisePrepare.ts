import type { IAutoMovieRandom } from "@automovie/interface";

import { SeededSmoothNoiseInternal } from "./SeededSmoothNoiseInternal";

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
export function seededSmoothNoisePrepare(
  random: IAutoMovieRandom,
  duration: number,
  maxFrequency: number,
  terms: number = 4,
): (u: number) => number {
  let admitted: boolean = false;
  let spectrum: SeededSmoothNoiseInternal.ISpectrum | undefined;
  return (u: number): number => {
    if (!admitted) {
      SeededSmoothNoiseInternal.admit(duration, maxFrequency, terms);
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
      sum += SeededSmoothNoiseInternal.oscillation(
        spectrum.rates[k]!,
        spectrum.phases[k]!,
        u,
        duration,
      );
    return SeededSmoothNoiseInternal.windowed(sum, u, spectrum.normalizer);
  };
}
