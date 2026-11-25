import { dot } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `dot` is the sum of the axis products.
 *
 * Scenarios:
 *
 * 1. (1, 2, 3) · (4, 5, 6) = 4 + 10 + 18 = 32.
 * 2. Perpendicular axes give 0.
 */
export function test_recovery_internal_dot(): void {
  TestValidator.equals(
    "products",
    [dot([1, 2, 3], [4, 5, 6]), dot([1, 0, 0], [0, 0, 1])],
    [32, 0],
  );
}
