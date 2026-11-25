import { to2 } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `to2` gives a point's coordinates along a plane's `u` and `v` from its
 * origin.
 *
 * Scenarios:
 *
 * 1. Over origin (1, 1, 0) with u = (0, -1, 0) and v = (1, 0, 0), the point (3, 0,
 *    5) is 2, -1, 5 from the origin: u = 1 and v = 2; the off-plane 5 drops.
 */
export function test_recovery_internal_to2(): void {
  TestValidator.equals(
    "coordinates",
    to2(
      { origin: [1, 1, 0], n: [0, 0, 1], u: [0, -1, 0], v: [1, 0, 0] },
      [3, 0, 5],
    ),
    [1, 2],
  );
}
