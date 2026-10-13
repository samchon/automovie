import { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { canonicalProductionFrameRate } from "../film/canonicalProductionFrameRate";
import { AutoMovieFilmEffectRuntimeError } from "./AutoMovieFilmEffectRuntimeError";

/**
 * Reduce one film-effect frame rate, or refuse it under the caller's code.
 *
 * The writer reports a malformed rate as invalid input and the reader reports
 * it as an invalid persisted runtime, while both reduce through the one engine
 * rate identity rather than a second rational rule.
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
