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
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify scalar and rational frame-rate inputs, exact reduction and nonpositive terms that must refuse.
 * @evidence contracts/development/testing.md#behavioral-verification The test calls canonicalProductionFrameRate directly and compares the returned numerator and denominator for both admitted input forms before checking invalid inputs.
 * @evidence contracts/development/testing.md#independent-expectations Dividing both entries of 48/2 by their common factor two yields 24/1. A scalar 24 has denominator 1. The coprime NTSC terms 30000 and 1001 stay unchanged, and zero cannot participate in a positive rate.
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
