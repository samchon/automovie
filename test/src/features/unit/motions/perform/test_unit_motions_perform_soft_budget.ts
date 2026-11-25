import type { IAutoMovieSoftBodyDomain } from "@automovie/interface";
import {
  HumanPerformanceSoftBudget,
  HumanRefusal,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { softPanel } from "../../../internal/softPanel";

/**
 * `HumanPerformanceSoftBudget` counts the native soft steps a film duration
 * takes, the ceiling of the duration over the domain's step with a rounding
 * guard, and refuses a count past the domain's budget.
 *
 * Scenarios, for a panel of 1/64 s steps and a budget of 1000:
 *
 * 1. One second is 64 steps, 1.01 s is 65 and no time is none.
 * 2. 1.1 s of 0.1 s steps divides to 11.000000000000002 in floating point and
 *    counts 11, not 12: the guard absorbs the rounding.
 * 3. 15.625 s is exactly the budget's 1000 steps and is admitted; one step more
 *    is refused naming the subject's `soft.solver.maxSteps`, the count and the
 *    budget as the range's maximum.
 */
export function test_unit_motions_perform_soft_budget(): void {
  const domain: IAutoMovieSoftBodyDomain = softPanel({ columns: 2, rows: 2 });

  // 1. The ceiling.
  TestValidator.equals(
    "steps of a duration",
    [1, 1.01, 0].map((duration: number): number =>
      HumanPerformanceSoftBudget("cloth", domain, duration),
    ),
    [64, 65, 0],
  );

  // 2. The rounding guard.
  TestValidator.equals(
    "a quotient a rounding above a whole number",
    HumanPerformanceSoftBudget(
      "cloth",
      { ...domain, solver: { ...domain.solver, fixedStepSeconds: 0.1 } },
      1.1,
    ),
    11,
  );

  // 3. The budget.
  TestValidator.equals(
    "the budget itself is admitted",
    HumanPerformanceSoftBudget("cloth", domain, 15.625),
    1000,
  );
  try {
    HumanPerformanceSoftBudget("cloth", domain, 15.625 + 1 / 64);
    throw new Error("one step past the budget was admitted");
  } catch (error) {
    TestValidator.predicate(
      "one step past the budget is refused",
      error instanceof HumanRefusal &&
        error.kind === "parameter" &&
        error.axis === "cloth.soft.solver.maxSteps" &&
        error.value === 1001 &&
        error.feasible?.kind === "range" &&
        error.feasible.minimum === 0 &&
        error.feasible.maximum === 1000,
    );
  }
}
