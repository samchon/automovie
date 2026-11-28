import type { IAutoMovieRecoveryCameraResidualsScoreOperation } from "@automovie/interface";
import { AutoMovieRecoveryCameraGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `scoreRecoveryCameraResiduals` keeps residuals with |r| ≤ threshold, in
 * order, and reports their median and 90th percentile by linear interpolation
 * at (N − 1) q (Hyndman and Fan 1996, definition 7).
 *
 * Scenarios:
 *
 * 1. Residuals [0.5, −3, null, 1, −2, 4] at threshold 3: indices [0, 1, 3, 4],
 *    sorted |r| = [0.5, 1, 2, 3]; median at 1.5 is 1.5, p90 at 2.7 is 2.7.
 * 2. No residual within the threshold: null diagnostics.
 * 3. A zero or infinite threshold refuses. Nonfinite residuals supply no support.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States inclusive residual support and the median/p90 interpolation rule.
 * @evidence contracts/development/testing.md#behavioral-verification Scores mixed and empty support, refuses zero or infinite thresholds and keeps only finite residuals.
 * @evidence contracts/development/testing.md#independent-expectations At threshold three the accepted magnitudes sort to 0.5, 1, 2, 3. Interpolation gives median 1.5 and p90 2.7.
 */
export function test_recovery_internal_score_camera_residuals(): void {
  const score: ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation> =
    AutoMovieRecoveryCameraGeometry.scoreCameraResiduals(
      [0.5, -3, null, 1, -2, 4],
      3,
    );
  TestValidator.predicate(
    "the supported residuals",
    JSON.stringify(score.indices) === "[0,1,3,4]" &&
      nclose(score.medianPx!, 1.5, 1e-15) &&
      nclose(score.p90Px!, 2.7, 1e-15),
  );
  TestValidator.equals(
    "no support",
    AutoMovieRecoveryCameraGeometry.scoreCameraResiduals([5, null], 3),
    { indices: [], medianPx: null, p90Px: null },
  );
  TestValidator.error("a zero threshold", (): unknown =>
    AutoMovieRecoveryCameraGeometry.scoreCameraResiduals([1], 0),
  );
  TestValidator.error("an infinite threshold", (): unknown =>
    AutoMovieRecoveryCameraGeometry.scoreCameraResiduals(
      [Infinity, 1],
      Infinity,
    ),
  );
  TestValidator.equals(
    "nonfinite values do not qualify as measured residuals",
    AutoMovieRecoveryCameraGeometry.scoreCameraResiduals(
      [Infinity, 1, NaN, -Infinity],
      2,
    ),
    { indices: [1], medianPx: 1, p90Px: 1 },
  );
}
