import { sub } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `sub` subtracts axis by axis.
 *
 * Scenarios:
 *
 * 1. (4, 5, 1) - (1, 1, 1) = (3, 4, 0).
 */
export function test_recovery_internal_sub(): void {
  TestValidator.equals("difference", sub([4, 5, 1], [1, 1, 1]), [3, 4, 0]);
}
