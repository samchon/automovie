import { AutoMovieEngineFilm } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `canonicalProductionFrameRate` is the exact rational identity of a frame
 * rate: a scalar rate is n/1, a ratio is reduced by its greatest common
 * divisor, and nonpositive terms are refused.
 *
 * Scenarios:
 *
 * 1. 24 is 24/1; 48/2 reduces to 24/1; NTSC 30000/1001 is already reduced.
 * 2. A scalar 0, and a ratio with a nonpositive term, are refused.
 */
export function test_engine_film_canonical_frame_rate(): void {
  TestValidator.equals(
    "each rate's reduced identity",
    [
      AutoMovieEngineFilm.canonicalProductionFrameRate(24),
      AutoMovieEngineFilm.canonicalProductionFrameRate({ numerator: 48, denominator: 2 }),
      AutoMovieEngineFilm.canonicalProductionFrameRate({ numerator: 30000, denominator: 1001 }),
    ],
    [
      { numerator: 24, denominator: 1 },
      { numerator: 24, denominator: 1 },
      { numerator: 30000, denominator: 1001 },
    ],
  );
  TestValidator.predicate(
    "nonpositive rates are refused",
    throwsError(
      () => AutoMovieEngineFilm.canonicalProductionFrameRate(0),
      "positive safe integer",
    ) &&
      throwsError(
        () => AutoMovieEngineFilm.canonicalProductionFrameRate({ numerator: 24, denominator: 0 }),
        "positive safe-integer terms",
      ),
  );
}
