import { AutoMovieEnginePhysics } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import fs from "node:fs/promises";
import path from "node:path";

import { repositoryRoot } from "../../internal/repositoryRoot";

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
 * @evidence contracts/development/common.md#meaningful-documentation Defines regression identity for the dual active-set solver's stored programs and their floating-point sequencing.
 * @evidence contracts/development/testing.md#behavioral-verification Solves twelve serialized sparse and preferred-row programs of 8, 16 and 32 variables and serializes actual solution bits and active inequalities.
 * @evidence contracts/development/testing.md#independent-expectations The stored expectations were recorded from the earlier solver. Exact IEEE-754 and active-set comparison detects order drift; independently derived optimality belongs to the dense-solver test.
 */
export async function test_engine_physics_solve_xpbd_dual_active_set(): Promise<void> {
  const cases: {
    problem: AutoMovieEnginePhysics.ISolveXpbdDualActiveSetProblem;
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
    const result: AutoMovieEnginePhysics.ISolveXpbdDualActiveSetResult | null =
      AutoMovieEnginePhysics.solveXpbdDualActiveSet(entry.problem);
    const got =
      result === null
        ? null
        : { primal: result.primal.map(bits), active: result.active };
    if (JSON.stringify(got) !== JSON.stringify(entry.result))
      failures.push(`problem ${index} differs`);
  });
  TestValidator.equals("dual active set bits", failures, []);
}
