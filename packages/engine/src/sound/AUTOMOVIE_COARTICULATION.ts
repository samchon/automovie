import type { AutoMovieViseme } from "@automovie/interface";

/**
 * Dominance parameters of the coarticulation sampler,
 * `sampleAutoMovieDialogueVisemeWeights` (Cohen and Massaro, "Modeling
 * coarticulation in synthetic visual speech", 1993).
 *
 * A phoneme's dominance is `magnitude × exp(−|t − centre| /
 * timeConstantSeconds)`, rising toward its centre and decaying after it with
 * the same rate. `timeConstantSeconds` is 50 ms: two neighbouring targets trade
 * dominance by a factor of `exp(2Δ/τ)` per frame of length Δ, so the largest
 * change of a weight between 24 fps frames is `tanh(Δ / 2τ)` ≈ 0.39, under the
 * half the sampler must keep, while a target 125 ms away still weighs
 * `exp(−2.5)` ≈ 0.08 of its own. `magnitude` is 1 for every viseme except `PP`
 * and `FF`, which take 5: their lips must close or meet the teeth on their own
 * frames even between open vowels, and at 5 a bilabial between two vowels three
 * frames away keeps 5 / (5 + 2 × 0.08) ≈ 0.97 of the weight at its centre.
 * These are the sampler's chosen defaults, not values fitted to recorded
 * speech.
 */
export const AUTOMOVIE_COARTICULATION: Readonly<{
  /** Time constant of every dominance function, in seconds. */
  timeConstantSeconds: number;

  /** Dominance magnitude of each viseme; absent visemes take `defaultMagnitude`. */
  magnitude: Readonly<Partial<Record<AutoMovieViseme, number>>>;

  /** Dominance magnitude of a viseme `magnitude` does not list. */
  defaultMagnitude: number;
}> = Object.freeze({
  timeConstantSeconds: 0.05,
  magnitude: Object.freeze({ PP: 5, FF: 5 }),
  defaultMagnitude: 1,
});
