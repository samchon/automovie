import { AutoMovieRecoveryCameraGeometry } from "@automovie/recovery";
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
 * 3. A NaN mapped coordinate returns null. Unpaired points are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names symmetric transfer distance and an infinite homogeneous image.
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates two pairs under identity, a zero homogeneous row, a NaN mapping and unpaired inputs.
 * @evidence contracts/development/testing.md#independent-expectations The authored displacement (3, 4) has five-pixel forward and backward norms, whose RMS is five.
 */
export function test_recovery_internal_measure_homography_errors(): void {
  const identity: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  TestValidator.equals(
    "identity transfers",
    AutoMovieRecoveryCameraGeometry.measureHomographyErrors(
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
    AutoMovieRecoveryCameraGeometry.measureHomographyErrors(
      { matrix: [1, 0, 0, 0, 1, 0, 0, 0, 0], inverse: identity },
      [[1, 2]],
      [[1, 2]],
    ),
    [null],
  );
  TestValidator.equals(
    "a nonfinite mapped coordinate has no observable transfer",
    AutoMovieRecoveryCameraGeometry.measureHomographyErrors(
      { matrix: [NaN, ...identity.slice(1)], inverse: identity },
      [[0, 0]],
      [[3, 4]],
    ),
    [null],
  );
  TestValidator.error("unpaired points", (): unknown =>
    AutoMovieRecoveryCameraGeometry.measureHomographyErrors(
      { matrix: identity, inverse: identity },
      [[0, 0]],
      [],
    ),
  );
}
