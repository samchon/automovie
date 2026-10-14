import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieQuadraticRow } from "../../../../packages/engine/src/math/IAutoMovieQuadraticRow";
import { solveAutoMovieBoundedDisplacement } from "../../../../packages/engine/src/math/solveAutoMovieBoundedDisplacement";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Executes the bounded contact scheduler and checks travel against independent minima, all-row residual limits, grouped round counts and zero-solve status; infeasible, exhausted and malformed problems must refuse rather than admit a partial solution.
 * @evidence contracts/testing.md#independent-expectations Intersections of x/y lower bounds give (1,2), and x>=1 with y>=x gives (1,1) under the positive diagonal objective. An empty constraint set minimizes at zero without a numerical solve. The retained 1e-6 travel and 1e-7 row tolerances bound numerical agreement, not exact solver arithmetic or geometric safety.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty rows, grouped additions, an initially satisfied row activated later, one-round exhaustion, infeasible caps, residual nonconvergence and invalid tolerances/budgets/masses/caps/indices. Independent-variable elimination and tiny couplings belong to bounded-independent.
 * @evidence contracts/testing.md#execution-ownership The named geometry entry is a CPU/WebAssembly solver integration test: active constraints reach the engine's pinned Clarabel reactor through the actual quadratic source, whereas the zero case bypasses it. It installs no consumer, builds no native artifact and starts no external process, browser or GPU; it registers no extra cases.
 */
export function test_geometry_bounded_displacement(): void {
  const solve: (input: {
    mass: readonly number[];
    upper: readonly number[];
    constraints: readonly { row: IAutoMovieQuadraticRow; group: number }[];
    tolerance: number;
    maximumRounds: number;
  }) => {
    travel: number[];
    violation: number;
    rounds: number;
    status: number | null;
  } = solveAutoMovieBoundedDisplacement;
  type Input = Parameters<typeof solve>[0];
  const base: Input = {
    mass: [1, 1],
    upper: [3, 3],
    constraints: [],
    tolerance: 1e-7,
    maximumRounds: 40,
  };
  const condition: (
    indices: number[],
    weights: number[],
    lower: number | null,
    upper: number | null,
    group?: number,
  ) => {
    row: {
      indices: number[];
      weights: number[];
      lower: number | null;
      upper: number | null;
    };
    group: number;
  } = (
    indices: number[],
    weights: number[],
    lower: number | null,
    upper: number | null,
    group: number = 0,
  ): {
    row: {
      indices: number[];
      weights: number[];
      lower: number | null;
      upper: number | null;
    };
    group: number;
  } => ({ row: { indices, weights, lower, upper }, group });
  const check: (
    result: ReturnType<
      (input: {
        mass: readonly number[];
        upper: readonly number[];
        constraints: readonly { row: IAutoMovieQuadraticRow; group: number }[];
        tolerance: number;
        maximumRounds: number;
      }) => {
        travel: number[];
        violation: number;
        rounds: number;
        status: number | null;
      }
    >,
    expected: number[],
  ) => void = (result: ReturnType<typeof solve>, expected: number[]): void => {
    TestValidator.predicate(
      "independent displacement",
      result.travel.length === expected.length &&
        result.travel.every(
          (v: number, i: number): boolean =>
            nclose(v - expected[i], 0, 1e-6) &&
            Math.abs(v - expected[i]) < 1e-6,
        ),
    );
    TestValidator.predicate(
      "all original rows checked",
      result.violation <= base.tolerance,
    );
  };
  const zero: {
    travel: number[];
    violation: number;
    rounds: number;
    status: number | null;
  } = solve(base);
  check(zero, [0, 0]);
  TestValidator.equals(
    "zero minimum needs no native iteration",
    zero.status,
    null,
  );
  const grouped: {
    constraints: {
      row: {
        indices: number[];
        weights: number[];
        lower: number | null;
        upper: number | null;
      };
      group: number;
    }[];
    mass: readonly number[];
    upper: readonly number[];
    tolerance: number;
    maximumRounds: number;
  } = {
    ...base,
    constraints: [
      condition([0], [1], 0.5, null),
      condition([0], [1], 1, null),
      condition([1], [1], 2, null),
      condition([1], [1], 1, null),
    ],
  };
  const exact: {
    travel: number[];
    violation: number;
    rounds: number;
    status: number | null;
  } = solve(grouped);
  check(exact, [1, 2]);
  TestValidator.equals("two grouped additions", exact.rounds, 2);
  TestValidator.predicate(
    "round budget cannot accept a partial solve",
    throwsError(
      (): {
        travel: number[];
        violation: number;
        rounds: number;
        status: number | null;
      } => solve({ ...grouped, maximumRounds: 1 }),
      "rounds 1",
    ),
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
      (): {
        travel: number[];
        violation: number;
        rounds: number;
        status: number | null;
      } => solve({ ...base, constraints: [condition([0], [1], 4, null)] }),
      "status 2",
    ),
  );
  TestValidator.predicate(
    "selected-row residual cannot become success",
    throwsError(
      (): {
        travel: number[];
        violation: number;
        rounds: number;
        status: number | null;
      } =>
        solve({
          ...base,
          upper: [0, 0],
          tolerance: 1e-15,
          constraints: [condition([0], [1], 1e-12, null)],
        }),
      "did not converge",
    ),
  );
  const refuse: (
    patch: Partial<{
      mass: readonly number[];
      upper: readonly number[];
      constraints: readonly { row: IAutoMovieQuadraticRow; group: number }[];
      tolerance: number;
      maximumRounds: number;
    }>,
    message: string,
  ) => void = (patch: Partial<Input>, message: string): void => {
    TestValidator.predicate(
      "invalid displacement problem",
      throwsError(
        (): {
          travel: number[];
          violation: number;
          rounds: number;
          status: number | null;
        } => solve({ ...base, ...patch }),
        message,
      ),
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
}
