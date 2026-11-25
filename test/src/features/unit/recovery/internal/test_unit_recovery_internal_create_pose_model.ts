import { createRecoveryPoseModel } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { recoveryStereoChart as chart } from "./recoveryStereoChart";

/**
 * The pixel pose model distinguishes rotation coordinates from translation.
 *
 * Scenarios:
 *
 * 1. For t along x, the tangent basis is y and z. Apply the skew matrices before
 *    the quarter-turn and the two inverse charts. All entries are exact dyadic
 *    fractions for this fixture.
 * 2. A translation away from unit gauge is refused.
 */
export function test_unit_recovery_internal_create_pose_model(): void {
  const model: ReturnType<typeof createRecoveryPoseModel> =
    createRecoveryPoseModel(chart.pose, chart.first, chart.second);
  /**
   * Exact integer numerators over 128, from K2⁻ᵀ E K1⁻¹ for each basis
   * direction.
   */
  const expected: readonly number[][] = [
    [0, 0, 0, 0, 0, -8, 32, 0, -56],
    [0, 0, 0, -2, 0, 4, 2, 0, -132],
    [0, 0, 0, 0, -1, -1, 0, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, -16, -16],
    [0, 0, 16, 0, 0, 0, 0, 16, 64],
    [-4, 0, 8, 0, -1, -1, -12, 1, 25],
  ];
  TestValidator.equals("translation tangent basis", model.tangent, [
    [0, 1, 0],
    [0, 0, 1],
  ]);
  /** Products and sums of the chart's small dyadic fractions round exactly. */
  const exactDyadicTolerance: number = 0;
  const matrices: number[][] = [model.matrix, ...model.derivatives];
  TestValidator.predicate(
    "matrix and all five derivatives",
    matrices.length === expected.length &&
      matrices.every(
        (matrix: number[], index: number): boolean =>
          matrix.length === 9 &&
          matrix.every((entry: number, at: number): boolean =>
            nclose(128 * entry, expected[index]![at]!, exactDyadicTolerance),
          ),
      ),
  );
  TestValidator.error("non-unit translation", (): unknown =>
    createRecoveryPoseModel(
      { ...chart.pose, translation: [2, 0, 0] },
      chart.first,
      chart.second,
    ),
  );
}
