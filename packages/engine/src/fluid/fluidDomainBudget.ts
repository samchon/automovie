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
 * water feature by `validateFluidDomain` before the first solve, and
 * `measureRenderSimulation` reads the same numbers into the render report so
 * a reviewer sees what the water cost. The record is not validated here, so
 * an invalid domain yields the arithmetic of its invalid fields.
 *
 * @evidence contracts/common.md#principled-implementation Closed-form counts over the lattice and emitters: cells as `columns·rows`, faces from the Arakawa C staggering of one extra face along each crossed axis, bytes as eight per stored real, worst-case updates as cells times the step budget, and the Courant number from the shared `fluidCourantNumber`.
 * @evidence contracts/common.md#clear-and-simple-design A pure derivation into the interface's flat budget record, leaving refusal thresholds to the validator, so the report and the gate share inputs without sharing a policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports the solver's real cost model, including uncached seeks in `worstCaseCellUpdates`, and copies nothing by hand from a consumer's expectations.
 * @evidence contracts/common.md#meaningful-documentation States that no step is integrated, which gate and which report use the numbers, and that the record is not validated here.
 * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic plus one pass over the declared spray emitters, at most `FLUID_MAX_SPRAYS` on a validated domain; no array of the lattice is read.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One derivation per call; the render measurement asks once per bound water body.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a fresh fixed-size record and retains nothing.
 */
export const fluidDomainBudget = (
  domain: IAutoMovieFluidDomain,
): IAutoMovieFluidBudget => {
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
};
