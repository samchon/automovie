import { firstAutoMovieInspectorSecond } from "@automovie/viewer/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `firstAutoMovieInspectorSecond` names the first second a request samples.
 *
 * Scenarios:
 *
 * 1. Sampling `at` seconds 4 and 9 starts at 4.
 * 2. Sampling evenly from 2.5 starts at 2.5.
 */
export function test_unit_viewer_inspector_first_second(): void {
  TestValidator.equals(
    "at",
    firstAutoMovieInspectorSecond({ sampling: { kind: "at", seconds: [4, 9] } }),
    4,
  );
  TestValidator.equals(
    "even",
    firstAutoMovieInspectorSecond({
      sampling: { kind: "even", from: 2.5, to: null, rate: 1 },
    }),
    2.5,
  );
}