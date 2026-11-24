import { measureRecoveryHomographyErrors } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `measureRecoveryHomographyErrors` measures each pair's symmetric transfer
 * error, the root mean square of the forward and backward transfer distances,
 * and null where a transfer reaches infinity.
 *
 * Scenarios:
 *
 * 1. Under the identity, (0, 0) and (3, 4) are 5 apart both ways: √50 / √2 = 5; a
 *    matching pair is 0.
 * 2. A matrix with a zero last row sends every point to infinity: null.
 * 3. Unpaired points are refused.
 */
export function test_unit_recovery_internal_measure_homography_errors(): void {
  const identity: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  TestValidator.equals(
    "identity transfers",
    measureRecoveryHomographyErrors(
      { matrix: identity, inverse: identity },
      [
        [0, 0],
        [1, 1],
      ],
      [
        [3, 4],
        [1, 1],
      ],
    ),
    [5, 0],
  );
  TestValidator.equals(
    "a transfer to infinity",
    measureRecoveryHomographyErrors(
      { matrix: [1, 0, 0, 0, 1, 0, 0, 0, 0], inverse: identity },
      [[1, 2]],
      [[1, 2]],
    ),
    [null],
  );
  TestValidator.error("unpaired points", (): unknown =>
    measureRecoveryHomographyErrors(
      { matrix: identity, inverse: identity },
      [[0, 0]],
      [],
    ),
  );
}
