import { AutoMovieRecoveryGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `sub` subtracts axis by axis.
 *
 * Scenarios:
 *
 * 1. (4, 5, 1) - (1, 1, 1) = (3, 4, 0).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States ordered axis-wise subtraction.
 * @evidence contracts/development/testing.md#behavioral-verification Subtracts one explicit point from another.
 * @evidence contracts/development/testing.md#independent-expectations The coordinate differences between (4, 5, 1) and (1, 1, 1) are (3, 4, 0).
 */
export function test_recovery_internal_sub(): void {
  TestValidator.equals("difference", AutoMovieRecoveryGeometry.sub([4, 5, 1], [1, 1, 1]), [3, 4, 0]);
}
