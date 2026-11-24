import { signedArea } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `signedArea` is a polygon's shoelace area, positive counter-clockwise.
 *
 * Scenarios:
 *
 * 1. The unit square counter-clockwise is 1, clockwise -1.
 * 2. The right triangle (0, 0), (4, 0), (0, 3) is 6.
 * 3. Fewer than three points enclose 0.
 */
export function test_unit_recovery_internal_signed_area(): void {
  TestValidator.equals(
    "areas",
    [
      signedArea([
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]),
      signedArea([
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
      ]),
      signedArea([
        [0, 0],
        [4, 0],
        [0, 3],
      ]),
      signedArea([
        [0, 0],
        [1, 1],
      ]),
    ],
    [1, -1, 6, 0],
  );
}
