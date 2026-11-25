import { dist } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `dist` is the length between two points.
 *
 * Scenarios:
 *
 * 1. (1, 1, 1) and (4, 5, 1) are 5 apart either way round.
 */
export function test_recovery_internal_dist(): void {
  TestValidator.equals(
    "distances",
    [dist([1, 1, 1], [4, 5, 1]), dist([4, 5, 1], [1, 1, 1])],
    [5, 5],
  );
}
