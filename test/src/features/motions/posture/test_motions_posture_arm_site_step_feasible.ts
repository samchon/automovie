import {
  HumanArmSiteStepFeasible
} from "../../../../../packages/motions/src/posture/internal/HumanArmSiteStepFeasible";
import { TestValidator } from "@nestia/e2e";

/**
 * Refuse a linearized site equality outside the pose's trust box. The form `2 x
 * - 3 y` on `[1, 2] × [-1, 4]` reaches `[-10, 7]`, including both endpoints.
 * Preserve the allowed Cartesian residual past either endpoint.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the allowed Cartesian residual beyond a row's signed trust-box extrema.
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the same signed affine row on the exact bounds, just outside them and with residual allowance.
 * @evidence contracts/development/testing.md#independent-expectations Coefficients 2 and -3 attain -10 and 7 over the independent box endpoints. Only the stated residual extends that interval.
 */
export function test_motions_posture_arm_site_step_feasible(): void {
  const box: Parameters<typeof HumanArmSiteStepFeasible>[1] = [
    { l: 1, u: 2 },
    { l: -1, u: 4 },
  ];
  const meets = (value: number, tolerance: number = 0): boolean =>
    HumanArmSiteStepFeasible(
      { key: "site", index: [0, 1], coef: [2, -3], l: value, u: value },
      box,
      tolerance,
    );
  TestValidator.equals(
    "exact signed extrema and residual allowance",
    [meets(-10), meets(7), meets(-11), meets(8), meets(-11, 1), meets(8, 1)],
    [true, true, false, false, true, true],
  );
}
