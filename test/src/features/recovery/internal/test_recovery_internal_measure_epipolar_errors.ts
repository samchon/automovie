import { AutoMovieRecoveryCameraGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `measureRecoveryEpipolarErrors` measures each pair's signed Sampson error and
 * mean point-to-epipolar-line distance under a fundamental matrix.
 *
 * Scenarios, with F = [t]× for t = (1, 0, 0), a sideways camera shift:
 *
 * 1. (0, 0) maps to the line y = 0 in the second view; (0, 1) lies 1 off it, and
 *    back the line y = 1 lies 1 off (0, 0): incidence -1 over two unit normals,
 *    so Sampson -1/√2 and a mean line distance 1.
 * 2. The zero matrix gives no lines: null.
 * 3. Unrepresentable norms or errors return null. Unpaired points are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names signed Sampson and average symmetric line error with undefined lines.
 * @evidence contracts/development/testing.md#behavioral-verification Measures a sideways-shift matrix and checks zero lines, overflowing norms and subnormal-normal errors alongside unpaired data.
 * @evidence contracts/development/testing.md#independent-expectations The shifted pair has incidence −1 and two unit line normals, giving Sampson −1/sqrt(2) and symmetric distance one pixel.
 */
export function test_recovery_internal_measure_epipolar_errors(): void {
  const [error] = AutoMovieRecoveryCameraGeometry.measureEpipolarErrors(
    [0, 0, 0, 0, 0, -1, 0, 1, 0],
    [[0, 0]],
    [[0, 1]],
  );
  TestValidator.predicate(
    "one pixel off",
    error !== null &&
      error !== undefined &&
      nclose(error.signedSampsonPx, -Math.SQRT1_2, 1e-12) &&
      error.symmetricPointLinePx === 1,
  );
  TestValidator.equals(
    "no lines",
    AutoMovieRecoveryCameraGeometry.measureEpipolarErrors(
      new Array<number>(9).fill(0),
      [[0, 0]],
      [[0, 1]],
    ),
    [null],
  );
  const subnormal: number = Number.MIN_VALUE;
  TestValidator.equals(
    "unrepresentable line norms and residuals supply no support",
    [
      AutoMovieRecoveryCameraGeometry.measureEpipolarErrors(
        [0, 0, subnormal, 0, 0, 0, subnormal, 0, 1],
        [[0, 0]],
        [[0, 0]],
      ),
      AutoMovieRecoveryCameraGeometry.measureEpipolarErrors(
        [0, 0, 1.5e308, 0, 0, 1.5e308, 1, 0, 0],
        [[1, 0]],
        [[0, 0]],
      ),
    ],
    [[null], [null]],
  );
  TestValidator.error("unpaired points", (): unknown =>
    AutoMovieRecoveryCameraGeometry.measureEpipolarErrors(
      [0, 0, 0, 0, 0, -1, 0, 1, 0],
      [],
      [[0, 0]],
    ),
  );
}
