import { AutoMovieEngineFilm } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `resolveProductionFrameRate` reads a production's exact frame rate from its
 * rational `frameRate` when given, else its scalar `fps`, and refuses a
 * rational rate whose value is not the stated `fps`.
 *
 * Scenarios:
 *
 * 1. `fps` 24 alone is 24/1; `fps` 30 with 60/2 reduces to 30/1; `fps` 30000 /
 *    1001 with 30000/1001 keeps the NTSC ratio.
 * 2. `fps` 29.97 with 30000/1001 disagrees and is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios name scalar fallback, reduced rational identity and the scalar and rational combinations that disagree.
 * @evidence contracts/development/testing.md#behavioral-verification The test calls resolveProductionFrameRate with a scalar, matching rational and mismatching pair and reads its ratio or refusal.
 * @evidence contracts/development/testing.md#independent-expectations Scalar 24 has denominator 1, 60/2 reduces to 30/1, and 30000/1001 already has coprime terms. The independently supplied display value 29.97 differs from the exact NTSC division and the route must refuse that combination.
 */
export function test_engine_film_resolve_frame_rate(): void {
  const ntsc = { numerator: 30000, denominator: 1001 };
  TestValidator.equals(
    "the exact rate of each production",
    [
      AutoMovieEngineFilm.resolveProductionFrameRate({ fps: 24 }),
      AutoMovieEngineFilm.resolveProductionFrameRate({
        fps: 30,
        frameRate: { numerator: 60, denominator: 2 },
      }),
      AutoMovieEngineFilm.resolveProductionFrameRate({ fps: 30000 / 1001, frameRate: ntsc }),
    ],
    [
      { numerator: 24, denominator: 1 },
      { numerator: 30, denominator: 1 },
      ntsc,
    ],
  );
  TestValidator.predicate(
    "a rational rate disagreeing with fps is refused",
    throwsError(
      () => AutoMovieEngineFilm.resolveProductionFrameRate({ fps: 29.97, frameRate: ntsc }),
      "does not equal",
    ),
  );
}
