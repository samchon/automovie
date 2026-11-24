import { cross } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `cross` is the right-handed cross product.
 *
 * Scenarios:
 *
 * 1. X × y = z, and y × x = -z.
 * 2. (1, 2, 3) × (4, 5, 6) = (2·6 - 3·5, 3·4 - 1·6, 1·5 - 2·4) = (-3, 6, -3).
 */
export function test_unit_recovery_internal_cross(): void {
  TestValidator.equals(
    "products",
    [
      cross([1, 0, 0], [0, 1, 0]),
      cross([0, 1, 0], [1, 0, 0]),
      cross([1, 2, 3], [4, 5, 6]),
    ],
    [
      [0, 0, 1],
      [0, 0, -1],
      [-3, 6, -3],
    ],
  );
}
