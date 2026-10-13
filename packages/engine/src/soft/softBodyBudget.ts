import { IAutoMovieSoftBodyBudget, IAutoMovieSoftBodyDomain } from "@automovie/interface";
import { softBodyTravelNumber } from "./softBodyTravelNumber";
/** Measure declared cloth topology, final state bytes and worst-case neighbour gathers without integrating a frame. The report counts two output xyz arrays, not every solver working buffer or supplied moving-boundary record.
 *
 * @evidence contracts/common.md#principled-implementation Rectangular lattice formulas count structural, shear and bend edges, while twice their total times sweeps and maxSteps bounds gathers; travel delegates to the shortest-edge owner. Admitted dimension and solver budgets are caller premises.
 * @evidence contracts/common.md#clear-and-simple-design Production render-simulation budgeting and domain admission share this scalar report rather than simulating cloth to discover its declared cost.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The report does not claim contact work, complete-boundary storage or all working allocations are covered by stateBytes; invalid domains are not made affordable by a guessed particle cap.
 * @evidence contracts/common.md#meaningful-documentation Defines declared versus measured cost, output-byte scope and admission premises.
 * @evidence contracts/performance.md#efficient-algorithms Topology formulas take constant work but travel scans P rest particles; total O(P) time and constant extra storage plus the fixed result record.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical travel/shortest-edge owners prevent budget policy drift; a report is recomputed for changed domains without caching cheap formulas.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The fresh scalar report belongs to the caller and retains no mesh, state buffer or integration task.
 *
 * @author Samchon
 */
export const softBodyBudget: (domain: IAutoMovieSoftBodyDomain) => IAutoMovieSoftBodyBudget = (
  domain: IAutoMovieSoftBodyDomain,
): IAutoMovieSoftBodyBudget => {
  const columns: number = domain.lattice.columns;
  const rows: number = domain.lattice.rows;
  const particles: number = columns * rows;
  /** Count axis starts that admit a neighbour at the given lattice reach; a too-short axis contributes zero edges. */
  const span: (length: number, reach: number) => number = (length: number, reach: number): number =>
    length > reach ? length - reach : 0;
  const quads: number = span(columns, 1) * span(rows, 1);
  const structural: number = span(columns, 1) * rows + columns * span(rows, 1);
  const shear: number = 2 * quads;
  const bend: number = span(columns, 2) * rows + columns * span(rows, 2);
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
