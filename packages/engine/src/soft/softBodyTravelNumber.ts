import type { IAutoMovieSoftBodyDomain } from "@automovie/interface";

import { shortestRestLength } from "./shortestRestLength";

/**
 * The travel number of the panel: `dt · referenceSpeed / shortestRestLength`.
 *
 * At most `1` for a projection that cannot tunnel. It is the single number that
 * says whether the authored step, lattice spacing and design speed can be
 * integrated at all, which is why the validator reads it instead of guessing a
 * step on the author's behalf. A lattice with no constraint at all — a single
 * particle — has nothing to cross and returns `0`.
 *
 * @author Samchon
 */
export const softBodyTravelNumber = (
  domain: IAutoMovieSoftBodyDomain,
): number => {
  const shortest = shortestRestLength(domain);
  if (shortest === Infinity) return 0;
  return (
    (domain.solver.fixedStepSeconds * domain.solver.referenceSpeed) / shortest
  );
};
