import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `linearizeRecoveryPoseResiduals` gives each pair's Sampson residual
 * y^T F x / |(F^T y, F x)| and its derivative along each of five essential
 * derivatives.
 *
 * Scenarios:
 *
 * 1. With F = [t]x for t = (1, 0, 0), the pair x = (0, 0), y = (0, 1) has F x =
 *    (0, -1, 0) and F^T y = (0, 1, -1), so the residual is -1 / sqrt(2).
 * 2. A derivative equal to F changes only the scale, so its Jacobian entry is
 *    zero; the derivative E33 gives (1) / sqrt(2).
 * 3. Unpaired points, or other than five derivatives, are refused.
 */
export function test_recovery_internal_linearize_pose_residuals(): void {
  const F: number[] = [0, 0, 0, 0, 0, -1, 0, 1, 0];
  const zero: number[] = new Array<number>(9).fill(0);
  const e33: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 1];
  const model = {
    matrix: F,
    derivatives: [F, e33, zero, zero, zero],
    tangent: [],
  };
  const linear: ReturnType<typeof AutoMovieRecoveryCameraMap.linearizePoseResiduals> =
    AutoMovieRecoveryCameraMap.linearizePoseResiduals(model, [[0, 0]], [[0, 1]]);
  TestValidator.predicate(
    "the residual",
    nclose(linear.residuals[0]!, -1 / Math.SQRT2, 1e-12),
  );
  const row: number[] = linear.jacobian[0]!;
  TestValidator.predicate("the scale derivative", nclose(row[0]!, 0, 1e-12));
  TestValidator.predicate(
    "the E33 derivative",
    nclose(row[1]!, 1 / Math.SQRT2, 1e-12),
  );
  TestValidator.predicate(
    "the zero derivatives",
    [2, 3, 4].every((at: number): boolean => nclose(row[at]!, 0, 1e-12)),
  );
  TestValidator.error("unpaired points", (): unknown =>
    AutoMovieRecoveryCameraMap.linearizePoseResiduals(model, [[0, 0]], []),
  );
  TestValidator.error("four derivatives", (): unknown =>
    AutoMovieRecoveryCameraMap.linearizePoseResiduals(
      { ...model, derivatives: [F, e33, zero, zero] },
      [[0, 0]],
      [[0, 1]],
    ),
  );
}
