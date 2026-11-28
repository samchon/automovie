import { AutoMovieEngineEnvironment } from "@automovie/engine";
import type { IAutoMovieReferenceGround } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `skyward` holds for a direction with a positive component along the
 * ground's up, of any length; the horizon itself is not skyward.
 *
 * Scenarios:
 *
 * 1. Up (0, 2, 0): (1, 0.1, 0) is skyward, (1, 0, 0) and (0, −1, 0) are not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines positive projection on the supplied up axis, excluding exact horizon.
 * @evidence contracts/development/testing.md#behavioral-verification Queries above, level and below direction vectors with a non-unit up basis.
 * @evidence contracts/development/testing.md#independent-expectations Dot product signs are positive, zero and negative under the supplied up vector (0, 2, 0), giving precisely one skyward result.
 */
export function test_engine_analysis_skyward(): void {
  const ground: IAutoMovieReferenceGround = {
    up: { x: 0, y: 2, z: 0 },
    elevation: 5,
  };
  TestValidator.predicate(
    "above the horizon",
    AutoMovieEngineEnvironment.skyward({ x: 1, y: 0.1, z: 0 }, ground),
  );
  TestValidator.predicate(
    "on the horizon",
    !AutoMovieEngineEnvironment.skyward({ x: 1, y: 0, z: 0 }, ground),
  );
  TestValidator.predicate(
    "below the horizon",
    !AutoMovieEngineEnvironment.skyward({ x: 0, y: -1, z: 0 }, ground),
  );
}
