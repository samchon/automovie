import type { IAutoMovieQuadraticRow } from "@automovie/interface";

import { FamilyConicFit } from "../../../reference-conics/FamilyConicFit";

/**
 * The fit's constrained step solved by the dual active-set method of Goldfarb and Idnani on the block-factored Hessian
 * (`FamilyConicFit.activeSet`).
 *
 * The made program: four values `d`, the Hessian diagonal 1 and 1 for `d0` and `d1` and the block `[[2, 1], [1, 2]]` for `d2` and
 * `d3`, the linear term `(-2, -2, -3, -3)`; the rows `d0 + d1 <= 1`, `d0 - d1 <= 0`, the first row again, `d3 <= 0.5`,
 * `-d2 <= 0`, and the box `-10 <= d_i <= 10`.
 *
 * Closed form: `d0` and `d1` minimize `(d0 - 2)^2 / 2 + (d1 - 2)^2 / 2` under `d0 + d1 <= 1`, so `d0 = d1 = 0.5` with multiplier 1.5
 * on that bound, and `d0 - d1 = 0` holds with multiplier 0; `d3 = 0.5` on its bound, and `2 d2 + d3 = 3` gives `d2 = 1.25`, so
 * `-d2 <= 0` is slack, and `d2 + 2 d3 - 3 + mu = 0` gives `mu = 0.75` on `d3 <= 0.5`.
 *
 * Scenarios:
 * 1. The step equals the closed form within 1e-12, and the multipliers within 1e-12: 1.5 shared by the two copies of the first row (one
 *    joins the working set; the other is dependent and is not taken), 0 on `d0 - d1 <= 0` and on `-d2 <= 0`, 0.75 on `d3 <= 0.5`,
 *    0 on the box.
 * 2. The Hessian splits into three blocks, `{d0}`, `{d1}` and `{d2, d3}`.
 * 3. From the unconstrained minimum `(2, 2, 1, 1)` the dual method takes the violated rows one at a time and ends with exactly two
 *    active, `d0 + d1 <= 1` and `d3 <= 0.5`; the degenerate `d0 - d1 <= 0`, the duplicate and the slack `-d2 <= 0` never join.
 * 4. Rows infeasible together are refused: `d0 <= 0` with `d0 >= 1`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `FamilyConicFit.activeSet` on a made program. It catches a step off the constrained minimizer, multipliers with the wrong sign or row, a dependent or degenerate row taken into the active set, a Hessian factored as one block, and infeasible rows solved as if feasible.
 * @evidence contracts/development/testing.md#independent-expectations The minimizer and its multipliers follow in closed form from the made Hessian, linear term and rows, written above.
 * @evidence contracts/development/testing.md#distinguishing-cases An active bound, a degenerate bound with zero multiplier, a duplicate row, a slack row, a slack box, and an infeasible pair.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous unit on one made program; no person, loft or realization.
 * @evidence contracts/development/common.md#meaningful-documentation Numbered scenarios state the made program and each expectation.
 */
export function test_human_fit_active_set(): void {
  const failures: string[] = [];
  const hessian: number[][] = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 2, 1], [0, 0, 1, 2]];
  const linear: number[] = [-2, -2, -3, -3];
  const upper = (indices: number[], weights: number[], bound: number): IAutoMovieQuadraticRow => ({ indices, weights, lower: null, upper: bound });
  const rows = (first: number): IAutoMovieQuadraticRow[] => [
    upper([0, 1], [1, 1], first),
    upper([0, 1], [1, -1], 0),
    upper([0, 1], [1, 1], first),
    upper([3], [1], 0.5),
    upper([2], [-1], 0),
    ...[0, 1, 2, 3].map((i): IAutoMovieQuadraticRow => ({ indices: [i], weights: [1], lower: -10, upper: 10 })),
  ];
  const solved = FamilyConicFit.activeSet(hessian, linear, rows(1), 1e-6);
  if (typeof solved === "string") failures.push("the made program was refused: " + solved);
  else {
    const close = (x: number, y: number): boolean => Math.abs(x - y) <= 1e-12;
    [0.5, 0.5, 1.25, 0.5].forEach((expected, i): void => {
      if (!close(solved.primal[i]!, expected)) failures.push(`d${i} is ${solved.primal[i]}, not ${expected}`);
    });
    const dual = solved.dual;
    if (!close(dual[0]! + dual[2]!, 1.5)) failures.push(`the first row's multipliers sum to ${dual[0]! + dual[2]!}, not 1.5`);
    if (!(dual[0] === 0 || dual[2] === 0)) failures.push("both copies of the first row joined the working set");
    if (!close(dual[1]!, 0)) failures.push(`d0 - d1 <= 0 carries ${dual[1]}, not 0`);
    if (!close(dual[3]!, 0.75)) failures.push(`d3 <= 0.5 carries ${dual[3]}, not 0.75`);
    if (!close(dual[4]!, 0)) failures.push(`-d2 <= 0 carries ${dual[4]}, not 0`);
    dual.slice(5).forEach((x, i): void => { if (x !== 0) failures.push(`box row ${i} carries ${x}`); });
    if (solved.blocks !== 3) failures.push(`the Hessian split into ${solved.blocks} blocks, not 3`);
    if (solved.working !== 2) failures.push(`${solved.working} rows ended active, not 2 (d0 + d1 <= 1 and d3 <= 0.5)`);
  }
  const refused = FamilyConicFit.activeSet(hessian, linear, [upper([0], [1], 0), upper([0], [-1], -1)], 1e-6);
  if (typeof refused !== "string") failures.push("the rows d0 <= 0 and d0 >= 1 were solved together");
  if (failures.length > 0) throw new Error("fit active set:\n" + failures.join("\n"));
}
