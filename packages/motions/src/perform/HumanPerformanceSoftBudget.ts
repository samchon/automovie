import type { IAutoMovieSoftBodyDomain } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Admit and return the number of native soft steps for a film duration.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the film and fixed-step clocks and the budget.
 * @evidence contracts/development/implementation.md#principled-implementation Ceiling covers the film's full interval with a rounding allowance at native boundaries.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Compute the native count and compare it to the declared limit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses over-budget spans instead of clipping the film or running a pose.
 * @evidence contracts/development/implementation.md#efficient-algorithms One conversion and comparison.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No evaluation needs caching.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state.
 */
export function HumanPerformanceSoftBudget(
  subject: string,
  domain: IAutoMovieSoftBodyDomain,
  duration: number,
): number {
  const dt: number = domain.solver.fixedStepSeconds;
  const count: number = Math.ceil(duration / dt - 1e-9);
  if (count > domain.solver.maxSteps)
    throw new HumanRefusal({
      kind: "parameter",
      axis: `${subject}.soft.solver.maxSteps`,
      value: count,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: domain.solver.maxSteps,
        unit: "steps",
        whole: true,
      },
      reason: `the performance lasts ${duration} s, ${count} steps of ${dt} s, past the domain's budget of ${domain.solver.maxSteps}`,
      fix: "raise the domain's maxSteps within the engine's soft budget, or lengthen its step",
    });
  return count;
}
