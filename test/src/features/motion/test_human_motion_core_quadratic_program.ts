import { HumanQuadraticProgram } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The planner's quadratic program solver (`HumanQuadraticProgram`, OSQP with
 * Ruiz equilibration, adaptive step sizes, polishing and the residual
 * termination) finds the known minimiser of small problems, holds its active
 * and equality rows to numerical precision, and certifies infeasible rows.
 *
 * Scenarios, each answer worked out by hand:
 * 1. `½(x₀² + x₁²) - x₀ - x₁` with `x₀ + x₁ <= 1`: `(0.5, 0.5)`, the row
 *    active.
 * 2. `½‖x‖²` with `x₀ + 2x₁ + 3x₂ = 14`: `(1, 2, 3)`, the equality met.
 * 3. `½(x₀² + x₁²)` with the rows `1000 x₀ >= 1000` and `0.001 x₁ <= -0.001`,
 *    six orders of magnitude apart: `(1, -1)`, both rows met.
 * 4. `½ x²` with the soft row `x >= 3` of weight 1: `1`, where the
 *    penalty's slope meets the curvature; of weight 10: `3`, the kink.
 * 5. The hard rows `x >= 1` and `x <= 0`: certified infeasible.
 * 6. Twenty variables whose second differences are squared, the ends held
 *    at 0 and 1 by equality rows: the straight line `i / 19`.
 *
 * Every minimiser is compared within 1e-6, and every equality and active
 * row of a polished solve within 1e-9 of its bound.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Solves real problems through the public solver and reads its minimiser, its status and its rows; a step that misses its rows or a minimiser off the hand-worked answer fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations Each minimiser is the problem's KKT solution worked out by hand, not a solver's output.
 * @evidence contracts/development/testing.md#distinguishing-cases An inequality active, an equality, rows of very different scales, a soft row on both sides of its kink, infeasible rows and a banded chain.
 * @evidence contracts/development/testing.md#execution-ownership In memory, milliseconds; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the solver, the claims and the 6 scenarios with their answers and tolerances.
 */
export function test_human_motion_core_quadratic_program(): void {
  const complaints: string[] = [];
  const problem = (
    n: number,
    band: number,
    diagonal: (i: number) => number,
    off: (i: number, j: number) => number,
    q: readonly number[],
    rows: HumanQuadraticProgram.IRow[],
  ): HumanQuadraticProgram.IProblem => ({
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
  const close = (
    label: string,
    state: HumanQuadraticProgram.IState,
    expected: readonly number[],
  ): void => {
    expected.forEach((v: number, i: number): void => {
      if (!(Math.abs(state.x[i]! - v) <= 1e-6))
        complaints.push(
          `${label}: x${i} ${state.x[i]}, expected ${v} (${state.status})`,
        );
    });
  };
  const held = (
    label: string,
    p: HumanQuadraticProgram.IProblem,
    state: HumanQuadraticProgram.IState,
    r: number,
    bound: number,
  ): void => {
    const row = p.rows[r]!;
    const v: number = row.index.reduce(
      (s: number, i: number, a: number): number =>
        s + row.coef[a]! * state.x[i]!,
      0,
    );
    if (!(Math.abs(v - bound) <= 1e-9))
      complaints.push(
        `${label}: row ${r} at ${v}, its bound ${bound} (${state.status})`,
      );
  };

  // 1. An inequality active.
  const one = problem(
    2,
    1,
    () => 1,
    () => 0,
    [-1, -1],
    [{ index: [0, 1], coef: [1, 1], l: -Infinity, u: 1 }],
  );
  const s1 = HumanQuadraticProgram.solve(one);
  close("active inequality", s1, [0.5, 0.5]);
  held("active inequality", one, s1, 0, 1);

  // 2. An equality.
  const two = problem(
    3,
    2,
    () => 1,
    () => 0,
    [0, 0, 0],
    [{ index: [0, 1, 2], coef: [1, 2, 3], l: 14, u: 14 }],
  );
  const s2 = HumanQuadraticProgram.solve(two);
  close("equality", s2, [1, 2, 3]);
  held("equality", two, s2, 0, 14);

  // 3. Rows six orders of magnitude apart.
  const three = problem(
    2,
    1,
    () => 1,
    () => 0,
    [0, 0],
    [
      { index: [0], coef: [1000], l: 1000, u: Infinity },
      { index: [1], coef: [0.001], l: -Infinity, u: -0.001 },
    ],
  );
  const s3 = HumanQuadraticProgram.solve(three);
  close("scaled rows", s3, [1, -1]);
  held("scaled rows", three, s3, 0, 1000);
  held("scaled rows", three, s3, 1, -0.001);

  // 4. A soft row on either side of its kink.
  for (const [weight, expected] of [
    [1, 1],
    [10, 3],
  ] as const)
    close(
      `soft row of weight ${weight}`,
      HumanQuadraticProgram.solve(
        problem(
          1,
          0,
          () => 1,
          () => 0,
          [0],
          [{ index: [0], coef: [1], l: 3, u: Infinity, weight }],
        ),
      ),
      [expected],
    );

  // 5. Infeasible rows.
  const five = HumanQuadraticProgram.solve(
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
  if (five.status !== "infeasible")
    complaints.push(`infeasible rows: status ${five.status}`);

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
  const six = problem(
    n,
    2,
    (i: number) => dtd(i, i),
    dtd,
    new Array(n).fill(0),
    [
      { index: [0], coef: [1], l: 0, u: 0 },
      { index: [n - 1], coef: [1], l: 1, u: 1 },
    ],
  );
  const s6 = HumanQuadraticProgram.solve(six);
  close(
    "banded chain",
    s6,
    Array.from({ length: n }, (_: unknown, i: number): number => i / (n - 1)),
  );
  held("banded chain", six, s6, 0, 0);
  held("banded chain", six, s6, 1, 1);

  TestValidator.equals(
    "the quadratic program solver finds the known minimisers",
    complaints,
    [],
  );
}
