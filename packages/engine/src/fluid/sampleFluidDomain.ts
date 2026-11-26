import {
  IAutoMovieFluidDomain,
  IAutoMovieFluidState,
} from "@automovie/interface";

import { simulateFluidDomain } from "./simulateFluidDomain";

/**
 * Sample a fluid domain at a shot second using its fixed-step clock.
 *
 * The selected step is `floor(max(time, 0) / fixedStepSeconds + 1e-9)`. The
 * step-fraction allowance can advance a time just before a boundary as well as
 * compensate division roundoff; this is not an unconditional floor of the
 * original quotient. Equivalent converted steps use the same stateless solve
 * regardless of playback frame rate.
 *
 * A finite negative second reads step 0 for an admitted domain. Non-finite time
 * throws here, while an invalid or over-budget converted step throws from
 * `simulateFluidDomain`. Domain admission and the integrator's numerical limits
 * still apply.
 */
export function sampleFluidDomain(
  domain: IAutoMovieFluidDomain,
  time: number,
): IAutoMovieFluidState {
  // The fixed clock has no ticks before its origin.
  const elapsed: number = time - Math.min(time, 0);
  if (!(elapsed < Infinity))
    throw new Error(
      `fluid domain "${domain.id}" cannot be sampled at a non-finite time`,
    );
  return simulateFluidDomain(
    domain,
    Math.floor(elapsed / domain.solver.fixedStepSeconds + 1e-9),
  );
}
