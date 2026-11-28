import { AutoMovieRecoveryGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `dot` is the sum of the axis products.
 *
 * Scenarios:
 *
 * 1. (1, 2, 3) · (4, 5, 6) = 4 + 10 + 18 = 32.
 * 2. Perpendicular axes give 0.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the componentwise inner product rule.
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates an ordered non-axis pair and two perpendicular unit axes.
 * @evidence contracts/development/testing.md#independent-expectations The three coordinate products sum to 32 and the perpendicular axes give zero.
 */
export function test_recovery_internal_dot(): void {
  TestValidator.equals(
    "products",
    [AutoMovieRecoveryGeometry.dot([1, 2, 3], [4, 5, 6]), AutoMovieRecoveryGeometry.dot([1, 0, 0], [0, 0, 1])],
    [32, 0],
  );
}
