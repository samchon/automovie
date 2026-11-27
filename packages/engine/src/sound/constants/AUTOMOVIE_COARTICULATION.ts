import type { AutoMovieViseme } from "@automovie/interface";

/*
 * Dominance parameters of the coarticulation sampler,
 * `sampleDialogueVisemeWeights` (Cohen and Massaro, "Modeling
 * coarticulation in synthetic visual speech", 1993).
 *
 * A phoneme's dominance is `magnitude × exp(−|t − centre| / τ)`, rising toward
 * its centre and decaying after it at the same rate, with `τ` the viseme's own
 * `timeConstantSeconds` entry or `defaultTimeConstantSeconds`. Between two
 * neighbouring targets of time constants `τ₁` and `τ₂`, the log ratio of their
 * dominances moves by `Δ (1/τ₁ + 1/τ₂)` per frame of length `Δ`, so a weight
 * changes by at most `tanh(Δ (1/τ₁ + 1/τ₂) / 4)` between frames. The sampler
 * keeps that under one half at 24 fps (`Δ` = 41.7 ms).
 *
 * `magnitude` is 1 for every viseme except `PP` and `FF`, which take 5: their
 * lips must close or meet the teeth on their own frames even between open
 * vowels. The default time constant is 50 ms: two vowels trade weight by at
 * most `tanh(Δ / 2τ)` ≈ 0.39 per 24 fps frame, while a target 125 ms away still
 * weighs `exp(−2.5)` ≈ 0.08 of its own.
 *
 * At 50 ms a bilabial's fivefold dominance would also reach five times as far
 * into its neighbours, so a short vowel between two /m/ would barely open. `PP`
 * and `FF` therefore decay faster, at 40 ms. The shortest time constant the
 * one-half rule admits for a bilabial beside a labiodental, the fastest pair,
 * is `2Δ / (4 artanh 0.5)` ≈ 37.9 ms; 40 ms is the round value above it, and
 * gives that pair at most `tanh(2Δ / 4τ)` ≈ 0.48 and a bilabial beside a vowel
 * at most 0.44 per frame. The rule is what bounds the reach: a shorter time
 * constant would open the vowel further but snap the lips by more than half a
 * weight in one frame. At its own centre, a bilabial between two vowels three
 * frames away keeps `5 / (5 + 2 exp(−2.5))` ≈ 0.97 of the weight, and a
 * three-frame vowel between two bilabials keeps `1 / (1 + 10 exp(−3Δ / 40 ms))`
 * ≈ 0.69 at its centre, against 0.55 with the bilabials at 50 ms.
 *
 * These are the sampler's chosen defaults, derived from the one-half rule, not
 * values fitted to recorded speech.
 */
export const AUTOMOVIE_COARTICULATION: Readonly<{
  /*
   * Time constant of a viseme `timeConstantSeconds` does not list, seconds.
   */
  defaultTimeConstantSeconds: number;

  /*
   * Time constant of each viseme's dominance function, seconds.
   */
  timeConstantSeconds: Readonly<Partial<Record<AutoMovieViseme, number>>>;

  /*
   * Dominance magnitude of each viseme; absent visemes take `defaultMagnitude`.
   */
  magnitude: Readonly<Partial<Record<AutoMovieViseme, number>>>;

  /*
   * Dominance magnitude of a viseme `magnitude` does not list.
   */
  defaultMagnitude: number;
}> = {
  defaultTimeConstantSeconds: 0.05,
  timeConstantSeconds: { PP: 0.04, FF: 0.04 },
  magnitude: { PP: 5, FF: 5 },
  defaultMagnitude: 1,
};
