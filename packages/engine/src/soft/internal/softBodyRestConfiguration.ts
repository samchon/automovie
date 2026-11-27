import { IAutoMovieSoftBodyDomain } from "@automovie/interface";

import { softBodyRestBuffer } from "./softBodyRestBuffer";

/*
 * Return fresh plain coordinates for the authored rest mesh with static anchors
 * and one selected state's targets applied. Production furnishing validation
 * consumes this configuration; moving targets require the separate
 * complete-boundary solver.
 */
export const softBodyRestConfiguration: (
  domain: IAutoMovieSoftBodyDomain,
  state?: string | null,
) => number[] = (
  domain: IAutoMovieSoftBodyDomain,
  state: string | null = null,
): number[] => Array.from(softBodyRestBuffer(domain, state));
