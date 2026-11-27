import { IAutoMovieSoftBodyDomain } from "@automovie/interface";

import { shortestRestLength } from "./shortestRestLength";

/*
 * Report dt*declared reference speed divided by the shortest structural rest
 * edge; no-edge Infinity yields zero. This authored travel ratio is an
 * admission heuristic, not a guarantee against collider tunnelling.
 */
export function softBodyTravelNumber(domain: IAutoMovieSoftBodyDomain): number {
  const shortest: number = shortestRestLength(domain);
  if (shortest === Infinity) return 0;
  return (
    (domain.solver.fixedStepSeconds * domain.solver.referenceSpeed) / shortest
  );
}
