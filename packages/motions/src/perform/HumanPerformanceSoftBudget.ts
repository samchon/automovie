import type { IAutoMovieSoftBodyDomain } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/** Admit and return the number of native soft steps for a film duration. */
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
