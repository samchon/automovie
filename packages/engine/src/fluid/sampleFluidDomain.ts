import {
  IAutoMovieFluidDomain,
  IAutoMovieFluidState,
} from "@automovie/interface";

import { simulateFluidDomain } from "./simulateFluidDomain";

/**
 * Sample a fluid domain at a shot second using its fixed-step clock.
 *
 * The selected step is `floor(max(time, 0) / fixedStepSeconds + 1e-9)`. The step-fraction allowance can advance a time just before a boundary as well as compensate division roundoff; this is not an unconditional floor of the original quotient. Equivalent converted steps use the same stateless solve regardless of playback frame rate.
 *
 * A finite negative second reads step 0 for an admitted domain. Non-finite time throws here, while an invalid or over-budget converted step throws from `simulateFluidDomain`. Domain admission and the integrator's numerical limits still apply.
 *
 * @evidence contracts/common.md#principled-implementation Rejects non-finite time, clamps finite negative time to zero, then floors the quotient plus 1e-9. The allowance shifts each representable boundary slightly earlier, so matching converted steps select the same state without asserting exact floor semantics or cross-host identity.
 * @evidence contracts/common.md#clear-and-simple-design Owns only the second-to-step conversion and delegates the solve to `simulateFluidDomain`, so a seek by step and a seek by second share one integrator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed 1e-9 step-fraction allowance and negative-time clamp are explicit clock policy for all domains; the allowance is not a measured error bound and may change a genuinely pre-boundary sample.
 * @evidence contracts/common.md#meaningful-documentation Gives the exact conversion formula, pre-boundary allowance, frame-rate-independent step selection, caller admission and negative/non-finite/over-budget behavior.
 * @evidence contracts/performance.md#efficient-algorithms Conversion takes constant work; replay costs O(cells + faces + step * (cells + faces + sources + drains)) time and O(cells + faces) storage, including allocation and final copying at step zero.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shares nothing across calls; the stateless replay and its cost are answered on `simulateFluidDomain`.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned state is the integrator's fresh record.
 */
export const sampleFluidDomain: (domain: IAutoMovieFluidDomain, time: number) => IAutoMovieFluidState = (
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
