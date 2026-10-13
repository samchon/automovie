import type {
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftBodyState,
} from "@automovie/interface";

import { simulateSoftBody } from "./simulateSoftBody";
import { softBodyStepAt } from "./softBodyStepAt";

/**
 * Sample a soft-body domain at a shot second, snapping down to its fixed step.
 *
 * @author Samchon
 */
export const sampleSoftBody = (
  domain: IAutoMovieSoftBodyDomain,
  time: number,
  state: string | null = null,
): IAutoMovieSoftBodyState => {
  const step = softBodyStepAt(domain, time);
  if (step === null)
    throw new Error(
      `soft body "${domain.id}" cannot be sampled at a non-finite time`,
    );
  return simulateSoftBody(domain, step, state);
};
