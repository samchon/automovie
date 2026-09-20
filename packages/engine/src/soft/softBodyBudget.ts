import type { IAutoMovieSoftBodyBudget, IAutoMovieSoftBodyDomain } from "@automovie/interface";
import { softBodyTravelNumber } from "./softBodyTravelNumber";

/**
 * The bounded cost a soft-body domain adds to a shot, derived from the record
 * alone.
 *
 * Nothing here integrates a step: a production is refused for an unaffordable
 * panel before the first solve, and the same numbers ride into the builder's
 * report so a reviewer sees what the fabric cost.
 *
 * @evidence requirements/effects-and-simulation/budgets-and-bounded-work.md#effects-per-frame-shot-budget Prices soft-body work across the declared shot horizon.
 * @evidence specifications/simulation-effects-and-sound/budget-admission.md#budget-frame-shot-sequence-composition Supplies the particle, constraint, and iteration cost for composition.
 * @author Samchon
 */
export const softBodyBudget = (
  domain: IAutoMovieSoftBodyDomain,
): IAutoMovieSoftBodyBudget => {
  const columns = domain.lattice.columns;
  const rows = domain.lattice.rows;
  const particles = columns * rows;
  const span = (length: number, reach: number): number =>
    length > reach ? length - reach : 0;
  const quads = span(columns, 1) * span(rows, 1);
  const structural = span(columns, 1) * rows + columns * span(rows, 1);
  const shear = 2 * quads;
  const bend = span(columns, 2) * rows + columns * span(rows, 2);
  return {
    domain: domain.id,
    particles,
    triangles: 2 * quads,
    structural,
    shear,
    bend,
    colliders: domain.colliders.length,
    stateBytes: 8 * 6 * particles,
    maxSteps: domain.solver.maxSteps,
    worstCaseGathers:
      2 *
      (structural + shear + bend) *
      domain.solver.iterations *
      domain.solver.maxSteps,
    travel: softBodyTravelNumber(domain),
  };
};
