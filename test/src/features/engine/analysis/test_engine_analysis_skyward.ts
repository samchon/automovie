import { AutoMovieEngineEnvironment } from "@automovie/engine";
import type { IAutoMovieReferenceGround } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `autoMovieSkyward` holds for a direction with a positive component along the
 * ground's up, of any length; the horizon itself is not skyward.
 *
 * Scenarios:
 *
 * 1. Up (0, 2, 0): (1, 0.1, 0) is skyward, (1, 0, 0) and (0, −1, 0) are not.
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
