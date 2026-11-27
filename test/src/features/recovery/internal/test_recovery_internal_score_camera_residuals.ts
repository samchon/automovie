import { AutoMovieRecoveryCameraGeometry } from "@automovie/recovery";
import type { IAutoMovieRecoveryCameraResidualsScoreOperation } from "@automovie/interface";
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
 * 3. A threshold of 0 refuses.
 */
export function test_recovery_internal_score_camera_residuals(): void {
  const score: ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation> =
    AutoMovieRecoveryCameraGeometry.scoreCameraResiduals([0.5, -3, null, 1, -2, 4], 3);
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
}
