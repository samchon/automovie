import { AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieQuadraticRow } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

type Input = Parameters<typeof AutoMovieEngineMath.solveQuadraticProgram>[0];
type Result = ReturnType<typeof AutoMovieEngineMath.solveQuadraticProgram>;

/**
 * `solveQuadraticProgram` minimizes sum d_i x_i^2 / 2 + q.x over
 * linear rows lower <= a.x <= upper, returning status 1 solved, 2 primal
 * infeasible (with a Farkas witness) or 3 dual infeasible (with a descent
 * ray).
 *
 * Expectations: two-variable optima from Lagrange multipliers, one-variable
 * ones from completing the square, residuals under 1e-7.
 *
 * Scenarios:
 *
 * 1. X0 + x1 >= 1 with equal curvatures splits 0.5, 0.5; with curvatures 1 and 4
 *    0.8, 0.2, a cap x0 <= 0.6 turns it to 0.6, 0.4.
 * 2. Curvatures 2, 8 with q = (-6, 16) and no rows: (3, -2). Zero curvature, q =
 *    -1, x in [0, 2] beside an empty row and a zero-weight row: 2. x = 2 fixed:
 *    2. q = 2 under x <= 10: -2. Mixed rows x0 >= 1, x0 + x1 = 3, x1 <= 2 with
 *    curvatures 1, 4: (2.4, 0.6).
 * 3. Repeating a solve gives the same result; overwriting a result, or a supplied
 *    initial vector, changes neither the input nor a later solve.
 * 4. A 2048-variable chain x_i = x_{i+1} in [-10, 10] with curvature 1 and q = -2
 *    solves to 2 everywhere, objective -2 x 2048, dual gap under 1e-5.
 * 5. The bounds x >= 2 and x <= 1 are infeasible (2) with signed multipliers y0 <
 *    0 < y1 that sum to zero and satisfy 2 y0 + y1 < 0; zero curvature with q =
 *    -1 is unbounded (3) with a ray x > 0.
 * 6. Near-parallel contact: x, y in [0, 1] with x + e y >= 1 + e forces x = y = 1
 *    (objective 2.5, dual gap under 1e-7) for e = 1 down to 1e-8, rows in
 *    either order; e = 0 frees y to 0; a gap of 0.1 beyond is infeasible.
 * 7. Refused: no or oversized dimensions, unequal vectors, an empty initial,
 *    negative curvature, +-1e30 linear terms, sparse rows, empty weights,
 *    indices -1, 1 and repeated, reversed and infinite bounds; admitted: zero
 *    curvature with bounds +-1e29 and an equality at 0 with an initial value. A
 *    zero-dimensional kernel call reports a negative setup status and the next
 *    public solve still succeeds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names solved, infeasible and unbounded certificates, residual tolerances, near-parallel binding rows and input failures.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public and kernel solvers on explicit bounded and unbounded systems and checks minimizers, residuals, Farkas witness, descent ray and repeatability.
 * @evidence contracts/development/testing.md#independent-expectations Completing squares and Lagrange multipliers give exact small solutions. Opposed x bounds are contradictory, and minimizing −x without a cap has a positive descent ray.
 */
export function test_engine_geometry_quadratic_program(): void {
  const solve = AutoMovieEngineMath.solveQuadraticProgram;
  const row = (
    indices: number[],
    weights: number[],
    lower: number | null,
    upper: number | null,
  ): IAutoMovieQuadraticRow => ({
    indices,
    weights,
    lower,
    upper,
  });
  const solved = (
    label: string,
    result: Result,
    expected: number[],
    e: number = 1e-6,
  ): void => {
    TestValidator.equals(`${label} status`, result.status, 1);
    TestValidator.predicate(
      `${label} optimum ${JSON.stringify(result.primal)}`,
      result.primal.length === expected.length &&
        result.primal.every(
          (v: number, i: number): boolean => Math.abs(v - expected[i]!) < e,
        ),
    );
    TestValidator.predicate(
      `${label} feasible`,
      result.maximumViolation < 1e-7,
    );
    TestValidator.predicate(
      `${label} stationary`,
      result.stationarityResidual < 1e-7,
    );
  };
  const sum: IAutoMovieQuadraticRow = row([0, 1], [1, 1], 1, null);

  // 1.
  solved(
    "equal split",
    solve({ diagonal: [1, 1], linear: [0, 0], rows: [sum] }),
    [0.5, 0.5],
  );
  const input: Input = {
    diagonal: [1, 4],
    linear: [0, 0],
    rows: [sum],
    initial: [1, 1],
  };
  const before: string = JSON.stringify(input);
  const first: Result = solve(input);
  solved("fourfold", first, [0.8, 0.2]);
  solved(
    "capped",
    solve({ ...input, rows: [sum, row([0], [1], 0, 0.6)] }),
    [0.6, 0.4],
  );

  // 2.
  solved(
    "centre",
    solve({ diagonal: [2, 8], linear: [-6, 16], rows: [] }),
    [3, -2],
  );
  solved(
    "linear",
    solve({
      diagonal: [0],
      linear: [-1],
      rows: [
        row([0], [1], 0, 2),
        row([], [], null, null),
        row([0], [0], -1, 1),
      ],
    }),
    [2],
  );
  solved(
    "fixed",
    solve({ diagonal: [1], linear: [0], rows: [row([0], [1], 2, 2)] }),
    [2],
  );
  solved(
    "square",
    solve({ diagonal: [1], linear: [2], rows: [row([0], [1], null, 10)] }),
    [-2],
  );
  solved(
    "mixed rows",
    solve({
      diagonal: [1, 4],
      linear: [0, 0],
      rows: [
        row([0], [1], 1, null),
        row([0, 1], [1, 1], 3, 3),
        row([1], [1], null, 2),
      ],
    }),
    [2.4, 0.6],
  );

  // 3.
  TestValidator.equals("repeat", solve(input), first);
  first.primal[0] = 999;
  first.dual[0] = 999;
  solved("after overwrite", solve(input), [0.8, 0.2]);
  TestValidator.equals("input kept", JSON.stringify(input), before);

  // 4.
  const size: number = 2048;
  const chain: Result = solve({
    diagonal: new Array<number>(size).fill(1),
    linear: new Array<number>(size).fill(-2),
    rows: [
      ...Array.from({ length: size - 1 }, (_: unknown, i: number) =>
        row([i, i + 1], [1, -1], 0, 0),
      ),
      ...Array.from({ length: size }, (_: unknown, i: number) =>
        row([i], [1], -10, 10),
      ),
    ],
  });
  solved("chain", chain, new Array<number>(size).fill(2), 1e-7);
  TestValidator.predicate(
    "chain objective",
    Math.abs(chain.objective + 2 * size) < 1e-7 &&
      Math.abs(chain.objective - chain.dualObjective) < 1e-5,
  );

  // 5.
  const infeasible: Result = solve({
    diagonal: [1],
    linear: [0],
    rows: [row([0], [1], 2, null), row([0], [1], null, 1)],
  });
  TestValidator.predicate(
    "Farkas witness",
    infeasible.status === 2 &&
      infeasible.dual[0]! < -0.1 &&
      infeasible.dual[1]! > 0.1 &&
      Math.abs(infeasible.dual[0]! + infeasible.dual[1]!) < 1e-7 &&
      (2 * infeasible.dual[0]! + infeasible.dual[1]! < -0.1),
  );
  const unbounded: Result = solve({ diagonal: [0], linear: [-1], rows: [] });
  TestValidator.predicate(
    "descent ray",
    unbounded.status === 3 && unbounded.primal[0]! > 0.1,
  );

  // 6.
  const contact = (e: number, gap: number, first: boolean): Result => {
    const box: IAutoMovieQuadraticRow[] = [
      row([0], [1], 0, 1),
      row([1], [1], 0, 1),
    ];
    const touch: IAutoMovieQuadraticRow = row(
      [0, 1],
      [1, e],
      1 + e + gap,
      null,
    );
    return solve({
      diagonal: [1, 4],
      linear: [0, 0],
      rows: first ? [touch, ...box] : [...box, touch],
    });
  };
  for (const e of [1, 1e-2, 1e-4, 1e-6, 1e-8])
    for (const order of [false, true]) {
      const r: Result = contact(e, 0, order);
      TestValidator.predicate(
        `corner ${e}/${order}`,
        r.status === 1 &&
          r.primal.every((v: number): boolean => Math.abs(v - 1) < 1e-7) &&
          r.maximumViolation < 1e-8 &&
          Math.abs(r.objective - 2.5) < 1e-7 &&
          Math.abs(r.objective - r.dualObjective) < 1e-7,
      );
    }
  const free: Result = contact(0, 0, false);
  TestValidator.predicate(
    "zero coefficient",
    free.status === 1 &&
      Math.abs(free.primal[0]! - 1) < 1e-7 &&
      Math.abs(free.primal[1]!) < 1e-4,
  );
  TestValidator.equals("gap infeasible", contact(1, 0.1, false).status, 2);

  // 7.
  const valid: Input = { diagonal: [1], linear: [0], rows: [] };
  const refused = (patch: Partial<Input>, message: string): void => {
    TestValidator.predicate(
      `refused ${message}`,
      throwsError((): unknown => solve({ ...valid, ...patch }), message),
    );
    TestValidator.equals("valid survives", solve(valid).status, 1);
  };
  refused({ diagonal: [], linear: [] }, "dimensions");
  refused({ diagonal: new Array(0x80000000) }, "dimensions");
  refused({ rows: new Array(0x80000000) }, "dimensions");
  refused({ linear: [] }, "dimensions");
  refused({ initial: [] }, "dimensions");
  refused({ diagonal: [-1] }, "nonnegative");
  for (const value of [1e30, -1e30]) refused({ linear: [value] }, "finite");
  refused({ rows: new Array(1) }, "complete");
  const equality: IAutoMovieQuadraticRow = row([0], [1], 0, 0);
  refused({ rows: [{ ...equality, weights: [] }] }, "dimensions");
  for (const indices of [[-1], [1], [0, 0]])
    refused(
      {
        rows: [{ ...equality, indices, weights: indices.map((): number => 1) }],
      },
      "indices",
    );
  refused({ rows: [{ ...equality, lower: 1 }] }, "ordered");
  refused({ rows: [{ ...equality, lower: -Infinity }] }, "finite");
  refused({ rows: [{ ...equality, upper: Infinity }] }, "finite");
  TestValidator.equals(
    "bounds below the sentinel",
    solve({ diagonal: [0], linear: [0], rows: [row([0], [1], -1e29, 1e29)] })
      .status,
    1,
  );
  TestValidator.equals(
    "equality with initial",
    solve({ ...valid, rows: [equality], initial: [0] }).status,
    1,
  );
  const setup = AutoMovieEngineMath.solveQuadraticKernel({
    diagonal: [],
    linear: [],
    columns: [0],
    rowIndices: [],
    values: [],
    lower: [],
    upper: [],
  });
  TestValidator.predicate("kernel setup refused", setup.status < 0);
  TestValidator.equals("recovered", solve(valid).status, 1);
}
