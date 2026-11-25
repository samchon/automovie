import type { IAutoMovieSimplexAtom } from "@automovie/interface";
import { mixRecoveryFeasibleSqpStep } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `mixRecoveryFeasibleSqpStep` blends the SQP step (1 - w) and the tilted step
 * w, and keeps it only when the objective row descends and every constraint row
 * stays within its offset; when the nominal blend fails it raises w to the
 * least weight that the rows allow.
 *
 * Scenarios:
 *
 * 1. Steps (1) and (1) over the objective -x and the row x <= 2 pass at the
 *    nominal weight 1/2 with the step (1), no numerical attempt.
 * 2. Steps (2, 0) and (0, 1) over the objective -x - y and the row x <= 1 give
 *    the step (2 - 2w) at the nominal 1/4, 3/2 > 1, so the row fails; the row's
 *    slope 2 - 2w meets its offset at w = 1/2, and the numerical weight is the
 *    least one just above it, whose step satisfies the row.
 */
export function test_unit_recovery_internal_mix_feasible_sqp_step(): void {
  const objective: IAutoMovieSimplexAtom = {
    indices: [0],
    values: [-1],
    offset: 0,
  };
  const easy = mixRecoveryFeasibleSqpStep(
    [objective, { indices: [0], values: [1], offset: 2 }],
    [1],
    [1],
    0.5,
  );
  TestValidator.equals("the nominal step", easy.step, [1]);
  TestValidator.equals("the nominal weight", easy.weight, 0.5);
  TestValidator.equals("no numerical attempt", easy.numericalAttempted, false);

  const hard = mixRecoveryFeasibleSqpStep(
    [
      { indices: [0, 1], values: [-1, -1], offset: 0 },
      { indices: [0], values: [1], offset: 1 },
    ],
    [2, 0],
    [0, 1],
    0.25,
  );
  TestValidator.equals("a numerical attempt", hard.numericalAttempted, true);
  TestValidator.equals("a supported step", hard.numericalSupported, true);
  TestValidator.predicate(
    "the weight just above one half",
    hard.weight > 0.5 && nclose(hard.weight, 0.5, 1e-9),
  );
  TestValidator.predicate(
    "the step meets the row",
    hard.step !== null && hard.step[0]! <= 1 && nclose(hard.step[0]!, 1, 1e-9),
  );
}
