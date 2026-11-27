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
 * 3. Unpaired points are refused.
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
  TestValidator.error("unpaired points", (): unknown =>
    AutoMovieRecoveryCameraGeometry.measureEpipolarErrors([0, 0, 0, 0, 0, -1, 0, 1, 0], [], [[0, 0]]),
  );
}
