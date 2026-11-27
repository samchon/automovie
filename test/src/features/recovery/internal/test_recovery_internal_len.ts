import { AutoMovieRecoveryGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `len` is the Euclidean length.
 *
 * Scenarios:
 *
 * 1. (3, 4, 12) has length 13; the zero vector 0.
 */
export function test_recovery_internal_len(): void {
  TestValidator.equals("lengths", [AutoMovieRecoveryGeometry.len([3, 4, 12]), AutoMovieRecoveryGeometry.len([0, 0, 0])], [13, 0]);
}
