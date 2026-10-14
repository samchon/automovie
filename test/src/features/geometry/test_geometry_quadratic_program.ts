import { solveAutoMovieQuadraticProgram, type IAutoMovieQuadraticRow } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";


import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose } from "../internal/nclose";

/**
 * Joint displacement is the constrained convex minimum, not independent clamps.
 * The two-variable optima follow from elementary Lagrange multipliers and the
 * one-variable cases from completing a square. No sampled portrait or stored
 * solver output supplies the expected answer.
 *
 * Scenarios:
 * 1. Equal masses split a required sum equally; a fourfold mass takes one fifth
 *    of the required sum. A cap redirects travel without losing the sum constraint.
 * 2. Linear terms move an unconstrained square's centre. A zero diagonal reduces
 *    a bounded problem to a linear minimum, and a zero row leaves it unchanged.
 * 3. Mixed equality/inequality rows reconstruct the original signed duals.
 *    Contradictory rows and an unbounded linear cost retain their distinct
 *    native infeasibility statuses instead of claiming success.
 * 4. Repeated calls, a supplied initial vector and returned-buffer mutation cannot alter the
 *    input or leak state into a later solve. Both original residuals are small.
 *
 * @evidence contracts/testing.md#behavioral-verification Solves the existing constrained diagonal QPs, checking analytic primal optima, solved status, original row/stationarity residuals, deterministic full-result replay, copied result buffers and unchanged input. Contradictory constraints and unbounded linear cost retain distinct primal/dual infeasible statuses beside a recovering valid solve.
 * @evidence contracts/testing.md#independent-expectations Lagrange multipliers split a unit sum into equal halves or inverse-mass fractions 0.8/0.2; a 0.6 cap redirects the remainder. Completing the square gives 3/-2 and -2, a bounded decreasing linear objective ends at two, and the mixed equality gives 2.4/0.6. Numeric optima retain strict 1e-6 agreement and original residuals strict 1e-7; replay compares current values rather than an independent oracle, and reported status alone is insufficient for the successful cases.
 * @evidence contracts/testing.md#distinguishing-cases Preserves equal/unequal masses, active cap, linear shifts, zero curvature and inactive rows, equality and upper-only rows, mixed signed-dual residual reconstruction, both infeasibility statuses, initial-vector compatibility, repeat calls and output/input ownership. Admission and nearly parallel limits have separate test owners; the backend ignores the supplied initial vector and remains cold.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry is CPU/WebAssembly integration through actual QP admission/assembly/residual evaluation and the pinned Clarabel reactor. It installs no consumer, builds no native artifact and starts no process, browser or GPU; it owns all cases without dynamic registration.
 */
export function test_geometry_quadratic_program(): void {
  const solve: typeof solveAutoMovieQuadraticProgram =
    solveAutoMovieQuadraticProgram;
  const row: (
    indices: number[],
    weights: number[],
    lower: number | null,
    upper: number | null,
  ) => IAutoMovieQuadraticRow = (
    indices: number[],
    weights: number[],
    lower: number | null,
    upper: number | null,
  ): IAutoMovieQuadraticRow => ({ indices, weights, lower, upper });
  const check: (
    result: ReturnType<typeof solve>,
    expected: number[],
  ) => void = (result: ReturnType<typeof solve>, expected: number[]): void => {
    TestValidator.equals("native solved status", result.status, 1);
    TestValidator.predicate(
      "independent optimum",
      result.primal.length === expected.length &&
        result.primal.every(
          (v: number, i: number): boolean =>
            nclose(v, expected[i], 1e-6) && Math.abs(v - expected[i]) < 1e-6,
        ),
    );
    TestValidator.predicate(
      "original constraint residual",
      result.maximumViolation < 1e-7,
    );
    TestValidator.predicate(
      "original stationarity residual",
      result.stationarityResidual < 1e-7,
    );
  };
  const sum: IAutoMovieQuadraticRow = row([0, 1], [1, 1], 1, null);
  check(solve({ diagonal: [1, 1], linear: [0, 0], rows: [sum] }), [0.5, 0.5]);
  const input: Parameters<typeof solve>[0] = {
    diagonal: [1, 4],
    linear: [0, 0],
    rows: [sum],
    initial: [1, 1],
  };
  const original: Parameters<typeof solve>[0] = structuredClone(input);
  const first: ReturnType<typeof solve> = solve(input);
  check(first, [0.8, 0.2]);
  const second: ReturnType<typeof solve> = solve(input);
  TestValidator.predicate(
    "deterministic native replay",
    equalGeometryTestValues(second, first),
  );
  first.primal[0] = 999;
  first.dual[0] = 999;
  check(solve(input), [0.8, 0.2]);
  TestValidator.predicate(
    "caller data unchanged",
    equalGeometryTestValues(input, original),
  );
  check(solve({ ...input, rows: [sum, row([0], [1], 0, 0.6)] }), [0.6, 0.4]);
  check(solve({ diagonal: [2, 8], linear: [-6, 16], rows: [] }), [3, -2]);
  check(
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
  check(
    solve({ diagonal: [1], linear: [0], rows: [row([0], [1], 2, 2)] }),
    [2],
  );
  check(
    solve({ diagonal: [1], linear: [2], rows: [row([0], [1], null, 10)] }),
    [-2],
  );
  check(
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
  TestValidator.equals(
    "unbounded linear objective is dual infeasible",
    solve({ diagonal: [0], linear: [-1], rows: [] }).status,
    3,
  );
  const infeasible: ReturnType<typeof solve> = solve({
    diagonal: [1],
    linear: [0],
    rows: [row([0], [1], 2, null), row([0], [1], null, 1)],
  });
  TestValidator.equals(
    "contradictory constraints are infeasible",
    infeasible.status,
    2,
  );
  check(solve({ diagonal: [1], linear: [0], rows: [] }), [0]);
}
