import { AutoMovieRecoveryGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `len` is the Euclidean length.
 *
 * Scenarios:
 *
 * 1. (3, 4, 12) has length 13; the zero vector 0.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the Euclidean length and zero vector.
 * @evidence contracts/development/testing.md#behavioral-verification Measures (3, 4, 12) and the zero vector.
 * @evidence contracts/development/testing.md#independent-expectations The sum of squares of the nonzero case is 169, whose square root is 13.
 */
export function test_recovery_internal_len(): void {
  TestValidator.equals("lengths", [AutoMovieRecoveryGeometry.len([3, 4, 12]), AutoMovieRecoveryGeometry.len([0, 0, 0])], [13, 0]);
}
