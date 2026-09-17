import { solveAutoMovieBoundedDisplacement } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Restricted scheduling retains all original affine contacts, including a row
 * initially satisfied at zero that later becomes violated. The independent
 * optima are intersections of axis bounds or the diagonal y=x in two variables.
 *
 * Scenarios:
 * 1. Already-clear input returns the exact zero minimum without a native solve.
 * 2. Grouped x/y requirements take two rounds; a one-round budget refuses.
 * 3. Negative coefficients activate a previously clear row and produce (1,1).
 * 4. A lower requirement beyond the cap reports infeasibility. Invalid budgets,
 *    masses, caps and even inactive malformed rows refuse beside valid input.
 */
export const test_geometry_bounded_displacement = (): void => {
  const solve = solveAutoMovieBoundedDisplacement;
  type Input = Parameters<typeof solve>[0];
  const base: Input = {
    mass: [1, 1],
    upper: [3, 3],
    constraints: [],
    tolerance: 1e-7,
    maximumRounds: 40,
  };
  const condition = (
    indices: number[],
    weights: number[],
    lower: number | null,
    upper: number | null,
    group = 0,
  ) => ({ row: { indices, weights, lower, upper }, group });
  const check = (
    result: ReturnType<typeof solve>,
    expected: number[],
  ): void => {
    TestValidator.predicate(
      "independent displacement",
      result.travel.every((v, i) => Math.abs(v - expected[i]) < 1e-6),
    );
    TestValidator.predicate(
      "all original rows checked",
      result.violation <= base.tolerance,
    );
  };
  const zero = solve(base);
  check(zero, [0, 0]);
  TestValidator.equals(
    "zero minimum needs no native iteration",
    zero.status,
    null,
  );
  const grouped = {
    ...base,
    constraints: [
      condition([0], [1], 0.5, null),
      condition([0], [1], 1, null),
      condition([1], [1], 2, null),
      condition([1], [1], 1, null),
    ],
  };
  const exact = solve(grouped);
  check(exact, [1, 2]);
  TestValidator.equals("two grouped additions", exact.rounds, 2);
  TestValidator.predicate(
    "round budget cannot accept a partial solve",
    throwsError(() => solve({ ...grouped, maximumRounds: 1 }), "rounds 1"),
  );
  check(
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
  TestValidator.predicate(
    "native infeasibility retained in refusal",
    throwsError(
      () => solve({ ...base, constraints: [condition([0], [1], 4, null)] }),
      "status 2",
    ),
  );
  TestValidator.predicate(
    "selected-row residual cannot become success",
    throwsError(
      () =>
        solve({
          ...base,
          upper: [0, 0],
          tolerance: 1e-15,
          constraints: [condition([0], [1], 1e-12, null)],
        }),
      "did not converge",
    ),
  );
  const refuse = (patch: Partial<Input>, message: string): void => {
    TestValidator.predicate(
      "invalid displacement problem",
      throwsError(() => solve({ ...base, ...patch }), message),
    );
    check(solve(base), [0, 0]);
  };
  for (const tolerance of [0, -1, NaN, Infinity])
    refuse({ tolerance }, "tolerance");
  for (const maximumRounds of [0, -1, 1.5, Infinity])
    refuse({ maximumRounds }, "budget");
  for (const mass of [
    [0, 1],
    [-1, 1],
  ])
    refuse({ mass }, "positive masses");
  refuse({ upper: [1] }, "matching");
  refuse({ upper: [-1, 1] }, "ordered");
  refuse({ mass: [NaN, 1] }, "finite");
  refuse({ constraints: [condition([2], [1], -1, null)] }, "indices");
};
