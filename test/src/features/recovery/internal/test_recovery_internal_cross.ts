import { AutoMovieRecoveryGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `cross` is the right-handed cross product.
 *
 * Scenarios:
 *
 * 1. X × y = z, and y × x = -z.
 * 2. (1, 2, 3) × (4, 5, 6) = (2·6 - 3·5, 3·4 - 1·6, 1·5 - 2·4) = (-3, 6, -3).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States right-handed orientation and ordered vector products.
 * @evidence contracts/development/testing.md#behavioral-verification Checks argument reversal on orthogonal unit axes and one non-axis pair.
 * @evidence contracts/development/testing.md#independent-expectations The component determinant gives (-3, 6, -3) for the two supplied vectors.
 */
export function test_recovery_internal_cross(): void {
  TestValidator.equals(
    "products",
    [
      AutoMovieRecoveryGeometry.cross([1, 0, 0], [0, 1, 0]),
      AutoMovieRecoveryGeometry.cross([0, 1, 0], [1, 0, 0]),
      AutoMovieRecoveryGeometry.cross([1, 2, 3], [4, 5, 6]),
    ],
    [
      [0, 0, 1],
      [0, 0, -1],
      [-3, 6, -3],
    ],
  );
}
