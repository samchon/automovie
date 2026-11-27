import { AutoMovieEngineGeometry } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `countAtLeast(value, least, label)` refuses a sampling count below `least`
 * with "<label> must be a safe integer >= <least>".
 *
 * Scenarios:
 *
 * 1. 3 and 8 against least 3 pass.
 * 2. 2 against least 3 is refused as "segments must be a safe integer >= 3".
 */
export function test_engine_geometry_count_at_least(): void {
  // 1.
  AutoMovieEngineGeometry.countAtLeast(3, 3, "segments");
  AutoMovieEngineGeometry.countAtLeast(8, 3, "segments");

  // 2.
  TestValidator.predicate(
    "2 < 3",
    throwsError(
      (): void => AutoMovieEngineGeometry.countAtLeast(2, 3, "segments"),
      "segments must be a safe integer >= 3",
    ),
  );
}
