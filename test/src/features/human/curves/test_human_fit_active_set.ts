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
 * 5. The scaled three-variable problem first activates `10x <= 0`, then `2(x+y+z) <= 2`, and removes the first row on the way
 *    to `x+y <= -1/2`. The last two bounds give `z = 3/2` and `x + y = -1/2`. Symmetry gives `x = y = -1/4` and the objective gradient
 *    at this point, `(-9/4, -9/4, -1/2)`, requires multipliers zero, one quarter, and seven quarters on the supplied rows.
 * 6. The first bound `10x + e(y+z) <= 0`, with `e` the smallest positive double, can require a subnormal rotation. At the solution,
 *    `y <= 1/4` is active because the unconstrained split of `y + w <= 1` about the equal targets would give `y = w = 1/2`.
 *    The constrained split gives `y = 1/4`, `w = 3/4`, leaving `z = 2` and `x = 0` to working precision. Their gradients give the
 *    three upper multipliers `1/5`, `5/4`, and `1/2`. The subnormal coefficients are below rounding in this calculation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `FamilyConicFit.activeSet` on a made program. It catches a step off the constrained minimizer, multipliers with the wrong sign or row, a dependent or degenerate row taken into the active set, a Hessian factored as one block, and infeasible rows solved as if feasible.
 * @evidence contracts/development/testing.md#independent-expectations The minimizer and its multipliers follow in closed form from the made Hessian, linear term and rows, written above.
 * @evidence contracts/development/testing.md#distinguishing-cases An active bound, a degenerate bound with zero multiplier, a duplicate row, a slack row, a slack box, an infeasible pair, a row removed by a partial dual step, and an active constraint with a subnormal tail.
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

  const dropped = FamilyConicFit.activeSet(
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [-2, -2, -2],
    [upper([0], [10], 0), upper([0, 1, 2], [2, 2, 2], 2), upper([0, 1], [1, 1], -0.5)], 1e-6,
  );
  if (typeof dropped === "string") failures.push("the scaled program was refused: " + dropped);
  else {
    const expected: number[] = [-0.25, -0.25, 1.5, 0, 0.25, 1.75];
    const actual: number[] = [...dropped.primal, ...dropped.dual];
    expected.forEach((value, i): void => {
      if (!(Math.abs(actual[i]! - value) <= 1e-12)) failures.push(`scaled program entry ${i} is ${actual[i]}, expected ${value}`);
    });
    if (dropped.iterations !== 4 || dropped.working !== 2) failures.push("the picked first row was not dropped on a partial step");
  }

  const subnormal: number = Number.MIN_VALUE;
  const rounded = FamilyConicFit.activeSet(
    [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]], [-2, -2, -2, -2],
    [upper([0, 1, 2], [10, subnormal, subnormal], 0), upper([1, 3], [1, 1], 1), upper([1], [1], 0.25)], 1e-6,
  );
  if (typeof rounded === "string") failures.push("the subnormal-tail program was refused: " + rounded);
  else {
    const expected: number[] = [0, 0.25, 2, 0.75, 0.2, 1.25, 0.5];
    const actual: number[] = [...rounded.primal, ...rounded.dual];
    expected.forEach((value, i): void => {
      if (!(Math.abs(actual[i]! - value) <= 1e-12)) failures.push(`subnormal-tail entry ${i} is ${actual[i]}, expected ${value}`);
    });
  }
  if (failures.length > 0) throw new Error("fit active set:\n" + failures.join("\n"));
}
