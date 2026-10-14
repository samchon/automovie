import {
  IAutoMovieFluidBudget,
  IAutoMovieFluidDomain,
} from "@automovie/interface";

import { fluidCourantNumber } from "./fluidCourantNumber";

/**
 * Declared lattice, state-payload and spray counts derived from one fluid domain.
 *
 * No step is integrated. `measureRenderSimulation` consumes the cell count and spray cap; `validateFluidDomain` separately enforces authored population budgets. The record is not validated here, so invalid or extreme fields can produce non-finite estimates.
 *
 * `stateBytes` counts eight bytes per depth or face velocity, excluding JavaScript array/object overhead, solver scratch arrays, surface buffers and spray storage. `worstCaseCellUpdates` is cells times maxSteps for one maximum seek, excluding face/flow work and repeated stateless seeks.
 *
 * @evidence contracts/common.md#principled-implementation Closed-form counts over the lattice and emitters: cells as `columns·rows`, faces from the Arakawa C staggering of one extra face along each crossed axis, bytes as eight per stored real, worst-case updates as cells times the step budget, and the Courant number from the shared `fluidCourantNumber`.
 * @evidence contracts/common.md#clear-and-simple-design A pure derivation into the interface's flat budget record, leaving refusal thresholds to the validator, so the report and the gate share inputs without sharing a policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts declared dimensions and caps without fixture tables or measured-runtime claims; the byte and update estimates deliberately omit overhead, scratch and repeated-call work as documented.
 * @evidence contracts/common.md#meaningful-documentation States admission ownership, the actual render-report fields consumed, omitted storage/work and the unvalidated-arithmetic limitation.
 * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic plus one pass over the declared spray emitters, at most `FLUID_MAX_SPRAYS` on a validated domain; no array of the lattice is read.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One derivation per call; the render measurement asks once per bound water body.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a fresh fixed-size record and retains nothing.
 */
export const fluidDomainBudget: (
  domain: IAutoMovieFluidDomain,
) => IAutoMovieFluidBudget = (
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
