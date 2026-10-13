import { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { canonicalProductionFrameRate } from "../film/canonicalProductionFrameRate";
import { AutoMovieFilmEffectRuntimeError } from "./AutoMovieFilmEffectRuntimeError";

/**
 * Reduce one film-effect frame rate, or refuse it under the caller's code.
 *
 * A positive safe integer `n` becomes `n/1`, and a rational with positive
 * safe-integer terms is divided by their greatest common divisor. The writer
 * reports a malformed rate as `film-effect-input-invalid` and the reader
 * reports it as `film-effect-runtime-invalid`, while both reduce through the
 * one engine rate identity rather than a second rational rule. Any failure of
 * the reduction, including a persisted rate that is not an object, becomes
 * that one coded refusal.
 *
 * @evidence contracts/common.md#principled-implementation Delegates to `canonicalProductionFrameRate`, which reduces by Euclid's greatest common divisor so equal rates have one spelling; a fractional scalar is refused because a decimal display value does not identify the rational that produced it.
 * @evidence contracts/common.md#clear-and-simple-design Exists only to translate the shared reducer's plain `Error` into the film-effect refusal class under a code the caller chooses, so the materializer and the runtime validator share one rule and differ only in how they classify the failure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The catch translates rather than recovers: it never substitutes a default rate, and every failure of the reducer, including a `TypeError` from a malformed persisted value, surfaces as the caller's refusal code.
 * @evidence contracts/common.md#meaningful-documentation States the two accepted input forms and their reduction, which caller uses which code, and that every reduction failure becomes the one coded refusal.
 * @evidence contracts/performance.md#efficient-algorithms Euclid's algorithm takes `O(log min(numerator, denominator))` modulo steps, and the scalar form is constant time; nothing else is computed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure reduction of one value per call with no coordination across requests to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a new two-number record owned by the caller and retains nothing.
 */
export const productionFilmEffectFrameRate = (
  frameRate: number | IAutoMovieProductionFrameRate,
  code: "film-effect-input-invalid" | "film-effect-runtime-invalid",
): IAutoMovieProductionFrameRate => {
  try {
    return canonicalProductionFrameRate(frameRate);
  } catch {
    throw new AutoMovieFilmEffectRuntimeError(
      code,
      "Film effect frame rate must be a positive exact rational identity.",
    );
  }
};
