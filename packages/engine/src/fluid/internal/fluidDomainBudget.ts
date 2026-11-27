import {
  IAutoMovieFluidBudget,
  IAutoMovieFluidDomain,
} from "@automovie/interface";

import { fluidCourantNumber } from "./fluidCourantNumber";

/*
 * Declared lattice, state-payload and spray counts derived from one fluid
 * domain.
 *
 * No step is integrated. `measureRenderSimulation` consumes the cell count and
 * spray cap; `validateFluidDomain` separately enforces authored population
 * budgets. The record is not validated here, so invalid or extreme fields can
 * produce non-finite estimates.
 *
 * `stateBytes` counts eight bytes per depth or face velocity, excluding
 * JavaScript array/object overhead, solver scratch arrays, surface buffers and
 * spray storage. `worstCaseCellUpdates` is cells times maxSteps for one maximum
 * seek, excluding face/flow work and repeated stateless seeks.
 */
export function fluidDomainBudget(
  domain: IAutoMovieFluidDomain,
): IAutoMovieFluidBudget {
  const cells: number = domain.grid.columns * domain.grid.rows;
  const faces: number =
    (domain.grid.columns + 1) * domain.grid.rows +
    domain.grid.columns * (domain.grid.rows + 1);
  let sprayParticleCap: number = 0;
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
}
