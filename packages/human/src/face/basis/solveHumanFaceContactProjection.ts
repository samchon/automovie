import { solveAutoMovieQuadraticProgram } from "@automovie/engine";

import type { IHumanFaceContactFloor } from "./IHumanFaceContactFloor";
import { isHumanFaceContactFloorSatisfied } from "./isHumanFaceContactFloorSatisfied";

/**
 * The displacement nearest a target whose reading along each row's gradient is
 * at least that row's lower bound, inside the budget and within the contact
 * tolerance of every original floor, or null when none exists. Used with a zero
 * target for the least correction, and with a smoothing target for a neighbour
 * whose own floors outrank it. Rows whose bound lies below -budget follow from
 * Cauchy-Schwarz for unit normals, and a solution longer than the budget is
 * refused after the solve.
 *
 * @evidence contracts/common.md#principled-implementation A three-variable identity-Hessian QP minimizes departure from the target in positive budget units, omitting unit-normal rows whose lower bounds follow from the movement ball. Native success must still satisfy all original affine floors within supplied tolerance and the actual Euclidean budget; nonlinear contact is checked by the caller.
 * @evidence contracts/common.md#clear-and-simple-design One projection serves least correction and one-ring preference targets, with shared floor verification rather than separate native acceptance rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing status one and finite comparisons are required; original floors remain even when solver rows use supplied relaxed lowers. Empty rows return the target under the caller's already-bounded smoothing-target premise, not general arbitrary-target admission.
 * @evidence contracts/common.md#meaningful-documentation Prose gives metre displacement/budget scaling, caller target premise, lower-row omission proof, null failure and the affine-versus-nonlinear boundary.
 * @evidence contracts/performance.md#efficient-algorithms Row scaling and final verification are O(R) for fixed three-dimensional vectors; native QP work depends on R and solver iterations. Empty-row smoothing avoids allocation/solve beyond the returned target copy.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing floor rows and target are used without rebuilding spatial queries; correction and smoothing share this solver owner but distinct targets/floors are not equivalent cached results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Solver input/receipt and copied three-value output are local until transfer; null releases local candidates and no solver handle/history or source mutation is retained.
 */
export function solveHumanFaceContactProjection(
  rows: readonly IHumanFaceContactFloor[],
  target: readonly number[],
  budget: number,
  tolerance: number,
  lowers: readonly number[],
): number[] | null {
  // A smoothing target is half a mean of pushes that each fit the budget.
  if (rows.length === 0) return [...target];
  const result: {
    status: number;
    iterations: number;
    primalResidual: number;
    dualResidual: number;
    objective: number;
    dualObjective: number;
    primal: number[];
    dual: number[];
  } & { maximumViolation: number; stationarityResidual: number } =
    solveAutoMovieQuadraticProgram({
      diagonal: [1, 1, 1],
      linear: target.map((value: number): number => -value / budget),
      rows: rows.flatMap(
        (
          row: IHumanFaceContactFloor,
          at: number,
        ): {
          indices: number[];
          weights: number[];
          lower: number;
          upper: null;
        }[] =>
          lowers[at] > -budget
            ? [
                {
                  indices: [0, 1, 2],
                  weights: [...row.normal],
                  lower: lowers[at] / budget,
                  upper: null,
                },
              ]
            : [],
      ),
    });
  if (result.status !== 1) return null;
  const vector: number[] = result.primal.map(
    (value: number): number => value * budget,
  );
  // NaN cannot satisfy an affine comparison; an infinite norm exceeds the
  // admitted finite budget. These checks also reject nonfinite native output.
  if (
    !isHumanFaceContactFloorSatisfied(rows, vector, tolerance) ||
    !(Math.hypot(...vector) <= budget)
  )
    return null;
  return vector;
}
