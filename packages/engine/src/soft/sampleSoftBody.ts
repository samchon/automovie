import {
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftBodyState,
} from "@automovie/interface";

import { simulateSoftBody } from "./simulateSoftBody";
import { softBodyStepAt } from "./softBodyStepAt";

/**
 * Sample the static cloth trajectory at a shot second by snapping to its
 * fixed-clock step. Nonfinite time throws; negative finite time samples rest.
 * This public sampling API currently has no production/viewer caller.
 */
export const sampleSoftBody: (
  domain: IAutoMovieSoftBodyDomain,
  time: number,
  state?: string | null,
) => IAutoMovieSoftBodyState = (
  domain: IAutoMovieSoftBodyDomain,
  time: number,
  state: string | null = null,
): IAutoMovieSoftBodyState => {
  const step: number | null = softBodyStepAt(domain, time);
  if (step === null)
    throw new Error(
      `soft body "${domain.id}" cannot be sampled at a non-finite time`,
    );
  return simulateSoftBody(domain, step, state);
};
