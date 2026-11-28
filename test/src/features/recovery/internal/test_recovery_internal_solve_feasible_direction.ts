import type { IAutoMovieSimplexAtom } from "@automovie/interface";
import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `solveRecoveryFeasibleDirection` solves min half d^2 + gamma subject to a_i d
 * - gamma <= offset_i through the simplex dual min half (sum lambda_i a_i)^2 +
 * sum lambda_i offset_i, and returns step = -sum lambda_i a_i.
 *
 * Scenarios:
 *
 * 1. Width 1 with the objective a = -1 and one constraint a = 1, offset 1: the
 *    dual is half (1 - 2 l)^2 + 1 - l over the objective weight l, minimal at
 *    l = 3/4, so the multipliers are (3/4, 1/4) and the step is 1/2; the
 *    primal agrees, d = 1/2 with gamma = -1/2.
 * 2. A first row whose offset is not zero is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the primal step, simplex multipliers and the objective-row restriction.
 * @evidence contracts/development/testing.md#behavioral-verification Solves the scalar two-row case and submits an objective row with a nonzero offset.
 * @evidence contracts/development/testing.md#independent-expectations The scalar dual's quadratic has minimum objective multiplier 3/4. Its weighted row sum is −1/2, so the direction is one half.
 */
export function test_recovery_internal_solve_feasible_direction(): void {
  const rows: IAutoMovieSimplexAtom[] = [
    { indices: [0], values: [-1], offset: 0 },
    { indices: [0], values: [1], offset: 1 },
  ];
  const budget = { maxIterations: 10000, maxEntries: 100000, maxWork: 1e8 };
  const direction: ReturnType<typeof AutoMovieRecoveryCameraMap.solveFeasibleDirection> =
    AutoMovieRecoveryCameraMap.solveFeasibleDirection(1, rows, 1e-16, budget);
  TestValidator.predicate(
    "the step",
    direction.step.length === 1 && nclose(direction.step[0]!, 0.5, 1e-6),
  );
  TestValidator.predicate(
    "the multipliers",
    direction.multipliers.length === 2 &&
      nclose(direction.multipliers[0]!, 0.75, 1e-6) &&
      nclose(direction.multipliers[1]!, 0.25, 1e-6),
  );
  TestValidator.error("an objective with an offset", (): unknown =>
    AutoMovieRecoveryCameraMap.solveFeasibleDirection(
      1,
      [{ indices: [0], values: [-1], offset: 1 }, rows[1]!],
      1e-16,
      budget,
    ),
  );
}
