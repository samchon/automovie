import {
  IAutoMovieFluidDomain,
  IAutoMovieFluidState,
} from "@automovie/interface";

import { simulateFluidDomain } from "./simulateFluidDomain";

/**
 * Sample a fluid domain at a shot second, snapping down to its fixed step.
 *
 * The snap is what makes playback frame-rate independent: captures at 24 and
 * 30 fps read the same integrated state whenever they land inside the same
 * step, instead of each integrating a different number of times. A negative
 * second reads step 0, and a second whose step is past `solver.maxSteps`
 * throws from `simulateFluidDomain`, as does a non-finite second here.
 *
 * @evidence contracts/common.md#principled-implementation Floors `time / fixedStepSeconds` with a `1e-9` step-fraction allowance, so a frame time that lands on a step boundary but rounds just below it in binary still reads that step rather than the one before.
 * @evidence contracts/common.md#clear-and-simple-design Owns only the second-to-step conversion and delegates the solve to `simulateFluidDomain`, so a seek by step and a seek by second share one integrator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The `1e-9` allowance is a fraction of one step absorbing binary rounding of the division, far below any frame interval; negative time is clamped to the start as the domain's state before it runs, and no domain or frame rate is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the snap direction and why it gives frame-rate independence, and what a negative, non-finite and over-budget second each do.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant work before delegating; the integration cost is answered on `simulateFluidDomain`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shares nothing across calls; the stateless replay and its cost are answered on `simulateFluidDomain`.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned state is the integrator's fresh record.
 */
export const sampleFluidDomain = (
  domain: IAutoMovieFluidDomain,
  time: number,
): IAutoMovieFluidState => {
  if (!Number.isFinite(time))
    throw new Error(
      `fluid domain "${domain.id}" cannot be sampled at a non-finite time`,
    );
  const clamped: number = time > 0 ? time : 0;
  return simulateFluidDomain(
    domain,
    Math.floor(clamped / domain.solver.fixedStepSeconds + 1e-9),
  );
};
