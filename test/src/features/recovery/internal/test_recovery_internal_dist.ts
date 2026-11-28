import { AutoMovieRecoveryGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `dist` is the length between two points.
 *
 * Scenarios:
 *
 * 1. (1, 1, 1) and (4, 5, 1) are 5 apart either way round.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names Euclidean distance and its symmetry in one frame.
 * @evidence contracts/development/testing.md#behavioral-verification Measures both orders of the same pair of Cartesian points.
 * @evidence contracts/development/testing.md#independent-expectations The displacement (3, 4, 0) has length five independently of argument order.
 */
export function test_recovery_internal_dist(): void {
  TestValidator.equals(
    "distances",
    [AutoMovieRecoveryGeometry.dist([1, 1, 1], [4, 5, 1]), AutoMovieRecoveryGeometry.dist([4, 5, 1], [1, 1, 1])],
    [5, 5],
  );
}
