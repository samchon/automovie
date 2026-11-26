import { IAutoMovieSoftBodyDomain } from "@automovie/interface";

/**
 * Convert finite shot seconds to a nonnegative absolute step, or null for
 * nonfinite time. A fixed 1e-9 step-space allowance handles near-boundary
 * floating rounding; the caller admits positive finite clock spacing and checks
 * the step budget.
 */
export function softBodyStepAt(
  domain: IAutoMovieSoftBodyDomain,
  time: number,
): number | null {
  // Pre-roll seconds contribute no elapsed time to the fixed clock.
  const elapsed: number = time - Math.min(time, 0);
  return elapsed < Infinity
    ? Math.floor(elapsed / domain.solver.fixedStepSeconds + 1e-9)
    : null;
}
