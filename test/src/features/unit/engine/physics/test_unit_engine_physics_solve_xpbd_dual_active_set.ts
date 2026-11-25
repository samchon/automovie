import { solveXpbdDualActiveSet } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import fs from "node:fs/promises";
import path from "node:path";

import { repositoryRoot } from "../../../internal/repositoryRoot";

/**
 * The dual active-set solver gives, bit for bit, the minimizer and active set
 * its stored problems were recorded with (`dualActiveSet/problems.json`: twelve
 * seeded programs of 8, 16 and 32 variables with sparse equality and inequality
 * rows and preferred rows, each with the minimizer's IEEE-754 bits and its
 * active inequalities as the solver gave them before its products and rotations
 * were reordered along J's stored rows). Each entry of `J^T a`, `J2 d2` and
 * each rotated pair is summed and rotated in the same order, so a reordering of
 * the loops alone must leave every bit in place.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stored programs, what was recorded and why the bits must match.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `solveXpbdDualActiveSet` and reads its minimizer and active set.
 * @evidence contracts/development/testing.md#independent-expectations The expected bits were recorded from the solver as it was before the reordering.
 * @evidence contracts/development/testing.md#distinguishing-cases Problems of three sizes, with and without equalities and preferred rows; a single changed bit or active row fails.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic on stored inputs; no world, viewer or simulation run.
 */
export async function test_unit_engine_physics_solve_xpbd_dual_active_set(): Promise<void> {
  const cases: {
    problem: solveXpbdDualActiveSet.IProblem;
    result: { primal: string[]; active: number[] } | null;
  }[] = JSON.parse(
    await fs.readFile(
      path.join(
        repositoryRoot(),
        "test/src/features/internal/dualActiveSet/problems.json",
      ),
      "utf8",
    ),
  );
  const bits = (value: number): string =>
    new BigUint64Array(new Float64Array([value]).buffer)[0]!.toString(16);
  const failures: string[] = [];
  cases.forEach((entry, index: number): void => {
    const result: solveXpbdDualActiveSet.IResult | null =
      solveXpbdDualActiveSet(entry.problem);
    const got =
      result === null
        ? null
        : { primal: result.primal.map(bits), active: result.active };
    if (JSON.stringify(got) !== JSON.stringify(entry.result))
      failures.push(`problem ${index} differs`);
  });
  TestValidator.equals("dual active set bits", failures, []);
}
