import {
  HumanSeidelProgram
} from "../../../../../packages/motions/src/posture/internal/HumanSeidelProgram";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a line's projection and one quotient, unitless. */
const ROUNDING: number = 1e-12;

/**
 * `HumanSeidelProgram` solves TOPP-RA's small linear programs (Seidel 1991,
 * ported from toppra): `max v₀x + v₁` over rows `a x + b ≤ 0` in one variable,
 * and `max vᵀx` over rows `a x₀ + b x₁ + c ≤ 0` within a box in two.
 *
 * Scenarios:
 *
 * 1. One variable under x ≤ 3 and x ≥ −1: maximising gives 3, minimising −1, and
 *    with no objective the middle, 1.
 * 2. One variable under x ≤ −1 and x ≥ 1 is infeasible.
 * 3. Two variables in the unit box under x₀ + x₁ ≤ 1: maximising x₀ + 2x₁ gives
 *    (0, 1); maximising x₀ alone, the corner (1, 0).
 * 4. Two variables under x₀ + x₁ ≥ 3 in the unit box are infeasible.
 * 5. `value` reads a row at a point: x₀ + x₁ − 1 at (0.25, 0.5) is −0.25.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines one- and two-coordinate linear optimization, infeasibility and constraint readout.
 * @evidence contracts/development/testing.md#behavioral-verification Solves box and cut examples under positive, negative and zero objectives and submits contradictory or unreachable rows.
 * @evidence contracts/development/testing.md#independent-expectations Hand optimization gives endpoints −1 and 3 and midpoint 1, then triangle vertices (0, 1) and (1, 0). Evaluating the stated row gives −0.25.
 */
export function test_motions_posture_seidel_program(): void {
  // 1. One variable.
  const between: HumanSeidelProgram.Line[] = [
    [1, -3],
    [-1, -1],
  ];
  TestValidator.predicate(
    "the one-variable optimum by the objective's sign",
    HumanSeidelProgram.solve1([1, 0], between).optvar === 3 &&
      HumanSeidelProgram.solve1([-1, 0], between).optvar === -1 &&
      HumanSeidelProgram.solve1([0, 0], between).optvar === 1,
  );

  // 2. Crossed bounds.
  TestValidator.predicate(
    "crossed bounds are infeasible",
    !HumanSeidelProgram.solve1(
      [1, 0],
      [
        [1, 1],
        [-1, 1],
      ],
    ).feasible,
  );

  // 3. Two variables.
  const cut: HumanSeidelProgram.Row[] = [[1, 1, -1]];
  const up: HumanSeidelProgram.ISolution2 = HumanSeidelProgram.solve2(
    [1, 2],
    cut,
    [0, 0],
    [1, 1],
  );
  const right: HumanSeidelProgram.ISolution2 = HumanSeidelProgram.solve2(
    [1, 0],
    cut,
    [0, 0],
    [1, 1],
  );
  TestValidator.predicate(
    "the two-variable optimum on the cut",
    up.feasible &&
      nclose(up.optvar[0], 0, ROUNDING) &&
      nclose(up.optvar[1], 1, ROUNDING) &&
      right.feasible &&
      nclose(right.optvar[0], 1, ROUNDING) &&
      nclose(right.optvar[1], 0, ROUNDING),
  );

  // 4. Beyond the box.
  TestValidator.predicate(
    "a row beyond the box is infeasible",
    !HumanSeidelProgram.solve2([1, 1], [[-1, -1, 3]], [0, 0], [1, 1]).feasible,
  );

  // 5. A row's value.
  TestValidator.predicate(
    "a row's value at a point",
    nclose(HumanSeidelProgram.value([1, 1, -1], [0.25, 0.5]), -0.25, ROUNDING),
  );
}
