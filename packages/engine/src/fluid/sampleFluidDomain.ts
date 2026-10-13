import {
  IAutoMovieFluidDomain,
  IAutoMovieFluidState,
} from "@automovie/interface";

import { simulateFluidDomain } from "./simulateFluidDomain";

/**
 * Sample a fluid domain at a shot second, snapping down to its fixed step.
 *
 * The snap is what makes playback frame-rate independent: captures at 24 and 30
 * fps read the same integrated state whenever they land inside the same step,
 * instead of each integrating a different number of times.
 *
 * @author Samchon
 */
export const sampleFluidDomain = (
  domain: IAutoMovieFluidDomain,
  time: number,
): IAutoMovieFluidState => {
  if (!Number.isFinite(time))
    throw new Error(
      `fluid domain "${domain.id}" cannot be sampled at a non-finite time`,
    );
  const clamped = time > 0 ? time : 0;
  return simulateFluidDomain(
    domain,
    Math.floor(clamped / domain.solver.fixedStepSeconds + 1e-9),
  );
};
