import { AutoMovieRecoveryGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `to2` gives a point's coordinates along a plane's `u` and `v` from its
 * origin.
 *
 * Scenarios:
 *
 * 1. Over origin (1, 1, 0) with u = (0, -1, 0) and v = (1, 0, 0), the point (3, 0,
 *    5) is 2, -1, 5 from the origin: u = 1 and v = 2; the off-plane 5 drops.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States projection onto a specified plane frame and origin.
 * @evidence contracts/development/testing.md#behavioral-verification Projects an off-plane point with orthogonal u and v axes.
 * @evidence contracts/development/testing.md#independent-expectations The displacement is (2, −1, 5). Dot products with negative y and positive x give (1, 2).
 */
export function test_recovery_internal_to2(): void {
  TestValidator.equals(
    "coordinates",
    AutoMovieRecoveryGeometry.to2(
      { origin: [1, 1, 0], n: [0, 0, 1], u: [0, -1, 0], v: [1, 0, 0] },
      [3, 0, 5],
    ),
    [1, 2],
  );
}
