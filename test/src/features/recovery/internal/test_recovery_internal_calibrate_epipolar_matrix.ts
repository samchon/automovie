import { AutoMovieRecoveryCameraGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { recoveryStereoChart as chart } from "./recoveryStereoChart";

/**
 * Calibration projects a pixel matrix onto equal essential singular values.
 *
 * Scenarios:
 *
 * 1. Doubling the first of two orthogonal essential directions gives raw singular
 *    values 2 and 1, then relative discrepancy √(1/10). Pixel calibration
 *    recovers the unperturbed epipolar matrix up to sign.
 * 2. Both rotations occur with both signs of the one-unit translation.
 * 3. A rank-one pixel matrix cannot determine two essential directions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the perturbed singular directions, accepted pose branches and rank-one refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Calibrates a known perturbation, compares projection discrepancy and both directions, and submits a rank-one pixel matrix.
 * @evidence contracts/development/testing.md#independent-expectations Raw singular values two and one yield relative projection discrepancy sqrt(1/10). Each of two rotations pairs with both signs of a unit translation.
 */
export function test_recovery_internal_calibrate_epipolar_matrix(): void {
  /**
   * These orthogonal input columns need no Jacobi rotation. The chart products,
   * normalization and sign comparisons use fewer than 64 rounded operations.
   */
  const tolerance: number = 64 * Number.EPSILON;
  const projected: ReturnType<typeof AutoMovieRecoveryCameraGeometry.calibrateEpipolarMatrix> =
    AutoMovieRecoveryCameraGeometry.calibrateEpipolarMatrix(
      [0, 0, 0, 0, 0, -2, 4, 0, -6],
      chart.first,
      chart.second,
      chart.budget.maxSingularSweeps,
    );
  const sign: number = projected.fundamental[6]! >= 0 ? 1 : -1;
  const alternated: number[] = [0, -1, 0, -1, 0, 0, 0, 0, -1];
  TestValidator.predicate(
    "normalized pixel matrix and projection discrepancy",
    projected.fundamental.every((value: number, index: number): boolean =>
      nclose(
        value,
        (sign * chart.fundamental[index]!) / Math.sqrt(66),
        tolerance,
      ),
    ) &&
      nclose(
        projected.relativeProjectionDiscrepancy,
        Math.sqrt(1 / 10),
        tolerance,
      ),
  );
  TestValidator.equals("four poses", projected.poses.length, 4);
  for (const rotation of [chart.pose.rotation, alternated])
    for (const side of [-1, 1])
      TestValidator.predicate(
        "both unit translations on each rotation branch",
        projected.poses.some(
          (pose: (typeof projected.poses)[number]): boolean =>
            pose.rotation.every((value: number, index: number): boolean =>
              nclose(value, rotation[index]!, tolerance),
            ) &&
            nclose(pose.translation[0], side, tolerance) &&
            nclose(pose.translation[1], 0, tolerance) &&
            nclose(pose.translation[2], 0, tolerance),
        ),
      );
  TestValidator.error("rank-one fundamental matrix", (): unknown =>
    AutoMovieRecoveryCameraGeometry.calibrateEpipolarMatrix(
      [1, 0, 0, 0, 0, 0, 0, 0, 0],
      chart.first,
      chart.second,
      chart.budget.maxSingularSweeps,
    ),
  );
}
