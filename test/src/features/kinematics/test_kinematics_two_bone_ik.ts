import { ITwoBoneIK, solveTwoBoneIK } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Analytic two-bone IK (law of cosines). Pinned against hand geometry.
 *
 * Scenarios:
 *
 * 1. Right-angle reach: equal unit bones to distance sqrt(2) give bend90 degrees
 *    and lift45 degrees, in reach.
 * 2. Fully extended at max reach (distance = sum) gives bend180, lift0, not
 *    clamped (the shell is inclusive).
 * 3. Distance0 with equal bones is fully folded (bend0), lift short-circuits to
 *    0 (the d===0 guard).
 * 4. Goal beyond reach (distance > sum) is clamped, bend180 (extended).
 * 5. Goal inside the inner shell (distance < abs(upper-lower)) is clamped, bend0
 *    (folded).
 * 6. Uniformly tiny and huge right triangles retain their angles; unrepresentable side ratios refuse explicitly.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the scalar two-bone solver and checks returned bend, lift and reach flag, catching squared-length overflow/underflow that otherwise yields NaN for a similar finite triangle.
 * @evidence contracts/testing.md#independent-expectations Equal sides with a square-root-two base form an isosceles right triangle with ninety-degree bend and forty-five-degree lift at every common scale; shell endpoints independently define folded/straight cases.
 * @evidence contracts/testing.md#distinguishing-cases Covers reachable and both clamped boundaries, zero distance, invalid lengths/distance, extreme shared scales and unrepresentable side ratios; chain-articulation tests own world orientation and plane choice.
 * @evidence contracts/testing.md#execution-ownership The exported kinematics unit entry owns all scalar cases and calls portable solver source without a skeleton application, native solver or rendering host.
 */
export function test_kinematics_two_bone_ik(): void {
  // 1. right angle
  const a: ITwoBoneIK = solveTwoBoneIK(1, 1, Math.SQRT2);
  TestValidator.predicate("bend 90", nclose(a.bend, 90, 1e-4));
  TestValidator.predicate("lift 45", nclose(a.lift, 45, 1e-4));
  TestValidator.equals("in reach", a.clamped, false);

  // 2. max reach, straight
  const b: ITwoBoneIK = solveTwoBoneIK(1, 1, 2);
  TestValidator.predicate("bend 180", nclose(b.bend, 180, 1e-4));
  TestValidator.predicate("lift 0", nclose(b.lift, 0, 1e-4));
  TestValidator.equals("max is in reach", b.clamped, false);

  // 3. distance0, equal bones folded, d===0 guard
  const c: ITwoBoneIK = solveTwoBoneIK(1, 1, 0);
  TestValidator.predicate("folded bend 0", nclose(c.bend, 0, 1e-4));
  TestValidator.predicate("lift 0 (guard)", nclose(c.lift, 0));
  TestValidator.equals("0 within shell", c.clamped, false);

  // 4. beyond reach: clamped, extended
  const d: ITwoBoneIK = solveTwoBoneIK(2, 1, 5);
  TestValidator.equals("too far clamped", d.clamped, true);
  TestValidator.predicate("clamped to straight", nclose(d.bend, 180, 1e-4));

  // 5. inside inner shell: clamped, folded
  const e: ITwoBoneIK = solveTwoBoneIK(2, 1, 0.5);
  TestValidator.equals("too near clamped", e.clamped, true);
  TestValidator.predicate("clamped to folded", nclose(e.bend, 0, 1e-4));

  TestValidator.predicate(
    "NaN upper length rejects",
    throwsError(
      (): ITwoBoneIK => solveTwoBoneIK(Number.NaN, 1, 1),
      ["two-bone IK upper length", "finite", "NaN"],
    ),
  );
  TestValidator.predicate(
    "zero lower length rejects",
    throwsError(
      (): ITwoBoneIK => solveTwoBoneIK(1, 0, 1),
      ["two-bone IK lower length", "> 0", "0"],
    ),
  );
  TestValidator.predicate(
    "infinite distance rejects",
    throwsError(
      (): ITwoBoneIK => solveTwoBoneIK(1, 1, Infinity),
      ["two-bone IK distance", "finite", "Infinity"],
    ),
  );
  TestValidator.predicate(
    "negative distance rejects",
    throwsError(
      (): ITwoBoneIK => solveTwoBoneIK(1, 1, -1),
      ["two-bone IK distance", "non-negative", "-1"],
    ),
  );
  for (const scale of [1e-200, 1e200]) {
    const similar: ITwoBoneIK = solveTwoBoneIK(
      scale,
      scale,
      Math.SQRT2 * scale,
    );
    TestValidator.predicate(
      `finite right-triangle angles at scale ${scale}`,
      nclose(similar.bend, 90) && nclose(similar.lift, 45),
    );
    TestValidator.equals(
      `similar triangle remains reachable at ${scale}`,
      similar.clamped,
      false,
    );
  }
  TestValidator.predicate(
    "unrepresentable side ratio refuses",
    throwsError(
      (): ITwoBoneIK => solveTwoBoneIK(1e-300, 1e300, 1e300),
      ["two-bone IK", "ratios", "precision"],
    ),
  );
  TestValidator.predicate(
    "nonzero goal ratio cannot underflow to root convention",
    throwsError(
      (): ITwoBoneIK => solveTwoBoneIK(1e300, 1e300, 1e-300),
      ["two-bone IK", "ratios", "precision"],
    ),
  );
}
