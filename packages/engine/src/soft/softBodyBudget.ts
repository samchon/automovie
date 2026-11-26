import {
  IAutoMovieSoftBodyBudget,
  IAutoMovieSoftBodyDomain,
} from "@automovie/interface";

import { softBodyTravelNumber } from "./softBodyTravelNumber";

/**
 * Measure declared cloth topology, final state bytes and worst-case neighbour
 * gathers without integrating a frame. The report counts two output xyz arrays,
 * not every solver working buffer or supplied moving-boundary record.
 */
export function softBodyBudget(
  domain: IAutoMovieSoftBodyDomain,
): IAutoMovieSoftBodyBudget {
  const columns: number = domain.lattice.columns;
  const rows: number = domain.lattice.rows;
  const particles: number = columns * rows;
  /**
   * Count axis starts that admit a neighbour at the given lattice reach; a
   * too-short axis contributes zero edges.
   */
  const span: (length: number, reach: number) => number = (
    length: number,
    reach: number,
  ): number => (length > reach ? length - reach : 0);
  const quads: number = span(columns, 1) * span(rows, 1);
  const structural: number = span(columns, 1) * rows + columns * span(rows, 1);
  const shear: number = 2 * quads;
  const bend: number = span(columns, 2) * rows + columns * span(rows, 2);

  // A cord's self-contact pairs every two segments that share no particle.
  const segments: number = particles - 1;
  const selfContact: boolean =
    (domain.contact ?? null) !== null &&
    domain.selfCollision &&
    (columns === 1 || rows === 1);
  const pairs: number =
    selfContact && segments > 2 ? ((segments - 1) * (segments - 2)) / 2 : 0;
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
    worstCaseSelfContactPairs:
      pairs * domain.solver.iterations * domain.solver.maxSteps,
    travel: softBodyTravelNumber(domain),
  };
}
