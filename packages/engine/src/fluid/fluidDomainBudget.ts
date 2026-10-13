import {
  IAutoMovieFluidBudget,
  IAutoMovieFluidDomain,
} from "@automovie/interface";

import { fluidCourantNumber } from "./fluidCourantNumber";

/**
 * The bounded cost a fluid domain adds to a shot, derived from the record
 * alone.
 *
 * Nothing here integrates a step: a production is refused for an unaffordable
 * water feature before the first solve, and the same numbers ride into the
 * builder's report so a reviewer sees what the water cost.
 *
 * @author Samchon
 */
export const fluidDomainBudget = (
  domain: IAutoMovieFluidDomain,
): IAutoMovieFluidBudget => {
  const cells = domain.grid.columns * domain.grid.rows;
  const faces =
    (domain.grid.columns + 1) * domain.grid.rows +
    domain.grid.columns * (domain.grid.rows + 1);
  let sprayParticleCap = 0;
  for (const spray of domain.sprays) sprayParticleCap += spray.maxParticles;
  return {
    domain: domain.id,
    cells,
    faces,
    stateBytes: 8 * (cells + faces),
    maxSteps: domain.solver.maxSteps,
    worstCaseCellUpdates: cells * domain.solver.maxSteps,
    sprayParticleCap,
    courant: fluidCourantNumber(domain),
  };
};
