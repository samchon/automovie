import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";
import { HumanQuadraticProgram } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The quadratic program's interior-point solve
 * (`HumanQuadraticProgram.interior`) finds the known minimiser and
 * multipliers of small problems, meets their optimality conditions, and
 * returns nothing for rows no point meets.
 *
 * Scenarios, each answer worked out by hand from the optimality conditions
 * `P x + q + A^T y = 0` with `y` positive on an upper end and negative on a
 * lower one:
 * 1. No rows, `P = tridiag(-1, 2, -1)` of three variables and `q = (-1, 0,
 *    -1)`: the linear system's solution `(1, 1, 1)`.
 * 2. `½‖x‖² - 2 x₀ + ½ x₁` with both variables boxed in `[-1, 1]`: the
 *    free minimiser `(2, -0.5)` is cut at the first box, so `(1, -0.5)`
 *    with multipliers `(1, 0)`.
 * 3. `½(x₀² + x₁²)` with the rows `1000 x₀ >= 1000` and `0.001 x₁ <=
 *    -0.001`, six orders of magnitude apart: `(1, -1)` with multipliers
 *    `(-0.001, 1000)`.
 * 4. `½ x²` with the soft row `x >= 3`: of weight 1, `x = 1` with the
 *    multiplier at the weight, `-1`, where the penalty's slope meets the
 *    curvature; of weight 10, `x = 3`, the kink, with multiplier `-3`
 *    inside the weight.
 * 5. The hard rows `x >= 1` and `x <= 0`: nothing is returned.
 * 6. Twenty variables whose second differences are squared, the ends held
 *    at 0 and 1 by equality rows: the straight line `i / 19`.
 *
 * Every minimiser and multiplier is compared within 1e-6, and every
 * returned state is read against the optimality conditions themselves
 * within 1e-6: stationarity, each hard row inside its interval, each
 * multiplier's sign on the end it holds, and a soft row's multiplier within
 * its weight, at the weight where the row is passed.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Solves real problems through the public entry and reads the minimiser, the multipliers and the optimality conditions on the problem's own data; a wrong reduced system, slack elimination, step rule, sign or unscaling leaves a residual or an answer off the hand-worked one and fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations Each minimiser and multiplier is the problem's optimality conditions solved by hand, and the conditions are evaluated here from the problem's matrices, not by the solver or by the OSQP solve; the 1e-6 tolerance is a hundred times the accuracy the solve aims at on these well-scaled problems. A problem whose soft row's multiplier sits exactly at its weight on the kink is degenerate for an interior method and is not asked.
 * @evidence contracts/development/testing.md#distinguishing-cases No row, an active and an inactive bound, rows of very different scales, a soft row on both sides of its kink, an equality pair on a banded chain, and an infeasible pair that must give nothing; the OSQP solve's own cases belong to test_human_motion_core_quadratic_program.
 * @evidence contracts/development/testing.md#execution-ownership In memory, milliseconds; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the solve, the claims, the six scenarios with their answers and the tolerance with its basis.
 */
export function test_human_motion_core_quadratic_interior(): void {
  const complaints: string[] = [];
  const TOLERANCE: number = 1e-6;
  const problem = (
    n: number,
    band: number,
    diagonal: (i: number) => number,
    off: (i: number, j: number) => number,
    q: readonly number[],
    rows: IAutoMovieMotionHumanQuadraticProgram.IRow[],
  ): IAutoMovieMotionHumanQuadraticProgram.IProblem => ({
    n,
    band,
    p: Array.from({ length: n }, (_: unknown, i: number): Float64Array => {
      const row: Float64Array = new Float64Array(band + 1);
      row[0] = diagonal(i);
      for (let j: number = 1; j <= band && i + j < n; ++j)
        row[j] = off(i, i + j);
      return row;
    }),
    q: Float64Array.from(q),
    rows,
  });

  // The optimality conditions of a returned state, read on the problem.
  const optimal = (
    label: string,
    p: IAutoMovieMotionHumanQuadraticProgram.IProblem,
    state: IAutoMovieMotionHumanQuadraticProgram.IState,
  ): void => {
    const gradient: number[] = Array.from(p.q);
    for (let i: number = 0; i < p.n; ++i)
      for (let j: number = 0; j <= p.band && i + j < p.n; ++j) {
        const entry: number = p.p[i]![j]!;
        gradient[i] = gradient[i]! + entry * state.x[i + j]!;
        if (j > 0) gradient[i + j] = gradient[i + j]! + entry * state.x[i]!;
      }
    p.rows.forEach((row: IAutoMovieMotionHumanQuadraticProgram.IRow, r: number): void => {
      const y: number = state.y[r]!;
      let value: number = 0;
      row.index.forEach((i: number, a: number): void => {
        value += row.coef[a]! * state.x[i]!;
        gradient[i] = gradient[i]! + row.coef[a]! * y;
      });
      const scale: number = Math.max(1, Math.abs(value));
      if (row.weight === undefined) {
        if (value > row.u + TOLERANCE * scale || value < row.l - TOLERANCE * scale)
          complaints.push(`${label}: hard row ${r} at ${value} outside [${row.l}, ${row.u}]`);
      } else {
        if (Math.abs(y) > row.weight * (1 + TOLERANCE) + TOLERANCE)
          complaints.push(`${label}: soft row ${r} multiplier ${y} past its weight ${row.weight}`);
        if (value > row.u + TOLERANCE * scale && Math.abs(y - row.weight) > TOLERANCE * Math.max(1, row.weight))
          complaints.push(`${label}: soft row ${r} passed above with multiplier ${y}, not its weight`);
        if (value < row.l - TOLERANCE * scale && Math.abs(y + row.weight) > TOLERANCE * Math.max(1, row.weight))
          complaints.push(`${label}: soft row ${r} passed below with multiplier ${y}, not minus its weight`);
      }
      const size: number = TOLERANCE * Math.max(1, Math.abs(y));
      if (y > size && value < row.u - TOLERANCE * scale)
        complaints.push(`${label}: row ${r} multiplier ${y} positive off its upper end (${value} < ${row.u})`);
      if (y < -size && value > row.l + TOLERANCE * scale)
        complaints.push(`${label}: row ${r} multiplier ${y} negative off its lower end (${value} > ${row.l})`);
    });
    const worst: number = gradient.reduce(
      (m: number, g: number): number => Math.max(m, Math.abs(g)),
      0,
    );
    const size: number = Math.max(
      1,
      ...Array.from(p.q, Math.abs),
      ...Array.from(state.y, Math.abs),
    );
    if (!(worst <= TOLERANCE * size))
      complaints.push(`${label}: stationarity off by ${worst}`);
  };
  const solved = (
    label: string,
    p: IAutoMovieMotionHumanQuadraticProgram.IProblem,
    x: readonly number[],
    y: readonly number[],
  ): void => {
    const state: IAutoMovieMotionHumanQuadraticProgram.IState | undefined =
      HumanQuadraticProgram.interior(p);
    if (state === undefined) {
      complaints.push(`${label}: no answer`);
      return;
    }
    x.forEach((v: number, i: number): void => {
      if (!(Math.abs(state.x[i]! - v) <= TOLERANCE * Math.max(1, Math.abs(v))))
        complaints.push(`${label}: x${i} ${state.x[i]}, expected ${v}`);
    });
    y.forEach((v: number, r: number): void => {
      if (!(Math.abs(state.y[r]! - v) <= TOLERANCE * Math.max(1, Math.abs(v))))
        complaints.push(`${label}: y${r} ${state.y[r]}, expected ${v}`);
    });
    optimal(label, p, state);
  };

  // 1. No rows: the linear system.
  solved(
    "no rows",
    problem(
      3,
      1,
      () => 2,
      () => -1,
      [-1, 0, -1],
      [],
    ),
    [1, 1, 1],
    [],
  );

  // 2. One bound active, one not.
  solved(
    "box",
    problem(
      2,
      1,
      () => 1,
      () => 0,
      [-2, 0.5],
      [
        { index: [0], coef: [1], l: -1, u: 1 },
        { index: [1], coef: [1], l: -1, u: 1 },
      ],
    ),
    [1, -0.5],
    [1, 0],
  );

  // 3. Rows six orders of magnitude apart.
  solved(
    "scaled rows",
    problem(
      2,
      1,
      () => 1,
      () => 0,
      [0, 0],
      [
        { index: [0], coef: [1000], l: 1000, u: Infinity },
        { index: [1], coef: [0.001], l: -Infinity, u: -0.001 },
      ],
    ),
    [1, -1],
    [-0.001, 1000],
  );

  // 4. A soft row on either side of its kink.
  for (const [weight, x, y] of [
    [1, 1, -1],
    [10, 3, -3],
  ] as const)
    solved(
      `soft row of weight ${weight}`,
      problem(
        1,
        0,
        () => 1,
        () => 0,
        [0],
        [{ index: [0], coef: [1], l: 3, u: Infinity, weight }],
      ),
      [x],
      [y],
    );

  // 5. Rows no point meets.
  const none: IAutoMovieMotionHumanQuadraticProgram.IState | undefined =
    HumanQuadraticProgram.interior(
      problem(
        1,
        0,
        () => 1,
        () => 0,
        [0],
        [
          { index: [0], coef: [1], l: 1, u: Infinity },
          { index: [0], coef: [1], l: -Infinity, u: 0 },
        ],
      ),
    );
  if (none !== undefined)
    complaints.push(`infeasible rows: an answer ${none.x[0]} (${none.status})`);

  // 6. A banded chain held at its ends: Σ (x[i-1] - 2x[i] + x[i+1])², as
  //    the curvature Dᵀ D of the second difference D.
  const n: number = 20;
  const dtd = (i: number, j: number): number => {
    let v: number = 0;
    for (let k: number = 1; k + 1 < n; ++k) {
      const coef = (t: number): number =>
        t === k - 1 || t === k + 1 ? 1 : t === k ? -2 : 0;
      v += coef(i) * coef(j);
    }
    return 2 * v;
  };
  solved(
    "banded chain",
    problem(
      n,
      2,
      (i: number): number => dtd(i, i),
      dtd,
      new Array<number>(n).fill(0),
      [
        { index: [0], coef: [1], l: 0, u: 0 },
        { index: [n - 1], coef: [1], l: 1, u: 1 },
      ],
    ),
    Array.from({ length: n }, (_: unknown, i: number): number => i / (n - 1)),
    [0, 0],
  );

  TestValidator.equals(
    "the interior-point solve finds the known minimisers and multipliers",
    complaints,
    [],
  );
}
