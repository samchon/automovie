import { AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieQuadraticRow } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

type Input = Parameters<typeof AutoMovieEngineMath.solveBoundedDisplacement>[0];
type Result = ReturnType<typeof AutoMovieEngineMath.solveBoundedDisplacement>;
type Condition = { row: IAutoMovieQuadraticRow; group: number };

/**
 * `solveBoundedDisplacement` finds the least mass-weighted travel in [0,
 * upper] meeting every affine contact row, adding grouped rows round by round
 * while keeping all original rows; independent coordinates stay at zero.
 *
 * Expectations: intersections of axis bounds or the diagonal y = x; travel within
 * 1e-6, every row within the tolerance 1e-7.
 *
 * Scenarios:
 *
 * 1. No rows: (0, 0) with no numerical solve (status null).
 * 2. x >= 0.5, x >= 1, y >= 2, y >= 1 in one group: (1, 2) in two rounds; a
 *    one-round budget refuses ("rounds 1").
 * 3. x >= 1, then y - x >= 0 (clear at zero, violated after), x <= 2 and an empty
 *    row: (1, 1).
 * 4. x >= 4 beyond the cap 3 refuses ("status 2"); a residual below the
 *    tolerance's reach refuses ("did not converge").
 * 5. Masses (1, 4, 2) under caps 1 with 0 x0 + x1 >= 1: x1 reaches 1 and x0, x2
 *    stay exact zeros; the input stays unchanged; 1e-8 x1 >= 1e-8 under
 *    tolerance 1e-13 keeps its coupling (x1 = 1).
 * 6. A constant row (no or zero weights) requiring 1 refuses ("constant rows");
 *    requiring 0 it gives zeros.
 * 7. Tolerances 0 and -1, budgets 0 and -1, masses (0, 1) and (-1, 1), one cap,
 *    a negative cap and index 2 refuse.
 */
export function test_engine_geometry_bounded_displacement(): void {
  const solve = AutoMovieEngineMath.solveBoundedDisplacement;
  const base: Input = { mass: [1, 1], upper: [3, 3], constraints: [], tolerance: 1e-7, maximumRounds: 40 };
  const condition = (
    indices: number[],
    weights: number[],
    lower: number | null,
    upper: number | null,
    group: number = 0,
  ): Condition => ({ row: { indices, weights, lower, upper }, group });
  const travels = (label: string, result: Result, expected: number[]): void => {
    TestValidator.predicate(
      `${label} ${JSON.stringify(result.travel)}`,
      result.travel.length === expected.length &&
        result.travel.every((v: number, i: number): boolean => Math.abs(v - expected[i]!) < 1e-6),
    );
    TestValidator.predicate(`${label} rows`, result.violation <= 1e-7);
  };

  // 1.
  const zero: Result = solve(base);
  travels("zero", zero, [0, 0]);
  TestValidator.equals("no solve", zero.status, null);

  // 2.
  const grouped: Input = {
    ...base,
    constraints: [
      condition([0], [1], 0.5, null),
      condition([0], [1], 1, null),
      condition([1], [1], 2, null),
      condition([1], [1], 1, null),
    ],
  };
  const exact: Result = solve(grouped);
  travels("grouped", exact, [1, 2]);
  TestValidator.equals("two rounds", exact.rounds, 2);
  TestValidator.predicate("budget 1", throwsError((): unknown => solve({ ...grouped, maximumRounds: 1 }), "rounds 1"));

  // 3.
  travels(
    "activated",
    solve({
      ...base,
      constraints: [
        condition([0], [1], 1, null),
        condition([0, 1], [-1, 1], 0, null, 1),
        condition([0], [1], null, 2, 2),
        condition([], [], null, null),
      ],
    }),
    [1, 1],
  );

  // 4.
  TestValidator.predicate(
    "infeasible",
    throwsError((): unknown => solve({ ...base, constraints: [condition([0], [1], 4, null)] }), "status 2"),
  );
  TestValidator.predicate(
    "residual",
    throwsError(
      (): unknown => solve({ ...base, upper: [0, 0], tolerance: 1e-15, constraints: [condition([0], [1], 1e-12, null)] }),
      "did not converge",
    ),
  );

  // 5.
  const three: Input = {
    mass: [1, 4, 2],
    upper: [1, 1, 1],
    constraints: [condition([0, 1], [0, 1], 1, null)],
    tolerance: 1e-7,
    maximumRounds: 40,
  };
  const before: string = JSON.stringify(three);
  const independent: Result = solve(three);
  TestValidator.equals("exact zeros", [independent.travel[0], independent.travel[2]], [0, 0]);
  TestValidator.predicate("cap reached", Math.abs(independent.travel[1]! - 1) < 1e-7);
  TestValidator.equals("input kept", JSON.stringify(three), before);
  const tiny: Result = solve({ ...three, tolerance: 1e-13, constraints: [condition([1], [1e-8], 1e-8, null)] });
  TestValidator.predicate("tiny coupling", Math.abs(tiny.travel[1]! - 1) < 1e-7);

  // 6.
  for (const [indices, weights] of [
    [[], []],
    [[0], [0]],
  ]) {
    TestValidator.predicate(
      `constant ${indices.length}`,
      throwsError((): unknown => solve({ ...three, constraints: [condition(indices, weights, 1, null)] }), "constant rows"),
    );
    TestValidator.equals(
      `constant ${indices.length} at zero`,
      solve({ ...three, constraints: [condition(indices, weights, 0, null)] }).travel,
      [0, 0, 0],
    );
  }

  // 7.
  for (const [patch, message] of [
    [{ tolerance: 0 }, "tolerance"],
    [{ tolerance: -1 }, "tolerance"],
    [{ maximumRounds: 0 }, "budget"],
    [{ maximumRounds: -1 }, "budget"],
    [{ mass: [0, 1] }, "positive masses"],
    [{ mass: [-1, 1] }, "positive masses"],
    [{ upper: [1] }, "matching"],
    [{ upper: [-1, 1] }, "ordered"],
    [{ constraints: [condition([2], [1], -1, null)] }, "indices"],
  ] satisfies [Partial<Input>, string][]) {
    TestValidator.predicate(`refused ${message}`, throwsError((): unknown => solve({ ...base, ...patch }), message));
    travels("valid survives", solve(base), [0, 0]);
  }
}
