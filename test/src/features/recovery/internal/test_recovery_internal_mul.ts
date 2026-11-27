import { AutoMovieRecoveryGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `mul` scales every axis.
 *
 * Scenarios:
 *
 * 1. (1, -2, 3) · 2 = (2, -4, 6); · 0 is the zero vector.
 */
export function test_recovery_internal_mul(): void {
  TestValidator.equals(
    "scaled",
    [AutoMovieRecoveryGeometry.mul([1, -2, 3], 2), AutoMovieRecoveryGeometry.mul([1, -2, 3], 0)],
    [
      [2, -4, 6],
      [0, -0, 0],
    ],
  );
}
