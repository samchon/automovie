import {
  factorRecoveryMapDesign,
  solveRecoveryMapDesign,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { recoveryStereoChart as chart } from "./recoveryStereoChart";

/**
 * Orthogonal columns take one QR reduction and fewer than 64 rounded products
 * of magnitude at most 32.
 */
const ORTHOGONAL_ROUNDING: number = 64 * 32 * Number.EPSILON;

/**
 * Local map fitting separates original rank from scaled damping.
 *
 * Scenarios:
 *
 * 1. Two rows in each orthogonal direction have norms √8 and √32. Their normalized
 *    design has unit singular values and compresses to two rows.
 * 2. The original answer is (3, 5). Damping in normalized coordinates divides it
 *    by four at a penalty of three. The normalized gradient is 20√2 in both
 *    cases.
 * 3. Collinear nonzero columns, an insufficient budget and a negative damping
 *    value each refuse before accepting a local answer.
 */
export function test_recovery_internal_factor_map_design(): void {
  const design: number[][] = [
    [2, 0],
    [0, 4],
    [2, 0],
    [0, 4],
  ];
  const right: number[] = [6, 20, 6, 20];
  const factor: ReturnType<typeof factorRecoveryMapDesign> =
    factorRecoveryMapDesign(design, right, chart.minimumRatio, chart.budget);
  TestValidator.equals(
    "original and compressed row counts",
    [factor.rows.length, factor.solveRows.length],
    [4, 2],
  );
  TestValidator.predicate(
    "original column norms and normalized rank",
    nclose(factor.scales[0]!, Math.sqrt(8), ORTHOGONAL_ROUNDING) &&
      nclose(factor.scales[1]!, Math.sqrt(32), ORTHOGONAL_ROUNDING) &&
      nclose(factor.designRatio, 1, ORTHOGONAL_ROUNDING),
  );
  for (const damping of [0, 3]) {
    const result: ReturnType<typeof solveRecoveryMapDesign> =
      solveRecoveryMapDesign(
        design,
        right,
        chart.minimumRatio,
        damping,
        chart.budget,
      );
    TestValidator.predicate(
      "scaled damping shrinks the identifiable original step",
      nclose(result.step[0]!, 3 / (1 + damping), ORTHOGONAL_ROUNDING) &&
        nclose(result.step[1]!, 5 / (1 + damping), ORTHOGONAL_ROUNDING) &&
        nclose(result.gradient, 20 * Math.SQRT2, ORTHOGONAL_ROUNDING) &&
        nclose(result.designRatio, 1, ORTHOGONAL_ROUNDING),
    );
  }
  TestValidator.error(
    "damping cannot repair original collinearity",
    (): unknown =>
      solveRecoveryMapDesign(
        [
          [1, 2],
          [2, 4],
        ],
        [1, 2],
        chart.minimumRatio,
        3,
        chart.budget,
      ),
  );
  TestValidator.error("exhausted linear budget", (): unknown =>
    factorRecoveryMapDesign(design, right, chart.minimumRatio, {
      ...chart.budget,
      maxLinearEntries: 11,
    }),
  );
  TestValidator.error("negative damping", (): unknown =>
    solveRecoveryMapDesign(design, right, chart.minimumRatio, -1, chart.budget),
  );
}
