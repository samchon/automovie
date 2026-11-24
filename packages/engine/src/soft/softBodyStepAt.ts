import { IAutoMovieSoftBodyDomain } from "@automovie/interface";

/**
 * Convert finite shot seconds to a nonnegative absolute step, or null for
 * nonfinite time. A fixed 1e-9 step-space allowance handles near-boundary
 * floating rounding; the caller admits positive finite clock spacing and checks
 * the step budget.
 */
export const softBodyStepAt: (
  domain: IAutoMovieSoftBodyDomain,
  time: number,
) => number | null = (
  domain: IAutoMovieSoftBodyDomain,
  time: number,
): number | null => {
  const clamped: number = time > 0 ? time : 0;
  return Math.floor(clamped / domain.solver.fixedStepSeconds + 1e-9);
};
