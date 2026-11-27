import { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { canonicalProductionFrameRate } from "../../film/internal/canonicalProductionFrameRate";
import { AutoMovieFilmEffectRuntimeError } from "../AutoMovieFilmEffectRuntimeError";

/**
 * Reduce one film-effect frame rate, or refuse it under the caller's code.
 *
 * A positive safe integer `n` becomes `n/1`, and a rational with positive
 * safe-integer terms is divided by their greatest common divisor. The writer
 * reports a malformed rate as `film-effect-input-invalid` and the reader
 * reports it as `film-effect-runtime-invalid`, while both reduce through the
 * one engine rate identity rather than a second rational rule. Any failure of
 * the reduction, including a persisted rate that is not an object, becomes that
 * one coded refusal.
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
