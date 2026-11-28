import { AutoMovieEngineMath } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `prepareLinearSystem` factors a square matrix once with partial pivoting and
 * returns a solver for any right-hand side, or null when a pivot vanishes;
 * `AutoMovieEngineMath.solveLinearSystem` answers one system the same way.
 *
 * Scenarios:
 *
 * 1. 2x + y = 3, x + 3y = 5 gives (0.8, 1.4), from the prepared solver and from
 *    `solve` alike, and the prepared solver answers a second right-hand side
 *    (1, 3) with (0, 1).
 * 2. A zero leading entry, [[0, 1], [1, 0]], is pivoted: (2, 3) gives (3, 2).
 * 3. Dependent rows [[1, 2], [2, 4]] are singular: null from both.
 * 4. Diag(1e-20, 2e-20) is not singular, its pivots tested against its own largest
 *    entry: (1e-20, 4e-20) solves to (1, 2).
 * 5. The empty system solves to the empty vector.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers reusing a factored matrix, pivoting, singular refusal, scale-aware pivots and the empty system.
 * @evidence contracts/development/testing.md#behavioral-verification Calls prepareLinearSystem and solveLinearSystem directly. The prepared solver reads two right-hand sides for the same matrix.
 * @evidence contracts/development/testing.md#independent-expectations Substitution gives (0.8, 1.4) and (0, 1) for the two systems. The swap matrix exchanges the components. Dependent rows are singular, and dividing by the small diagonal pivots yields (1, 2).
 */
export function test_engine_math_prepare_linear_system(): void {
  const close = (
    actual: readonly number[] | null,
    expected: readonly number[],
  ): boolean =>
    actual !== null &&
    actual.length === expected.length &&
    actual.every((value: number, index: number): boolean =>
      nclose(value, expected[index]!, 1e-12),
    );
  const rows: number[][] = [
    [2, 1],
    [1, 3],
  ];
  const solver: ((right: readonly number[]) => number[]) | null =
    AutoMovieEngineMath.prepareLinearSystem(rows);
  TestValidator.predicate(
    "the prepared solver and solve agree on every right-hand side",
    solver !== null &&
      close(solver([3, 5]), [0.8, 1.4]) &&
      close(solver([1, 3]), [0, 1]) &&
      close(AutoMovieEngineMath.solveLinearSystem(rows, [3, 5]), [0.8, 1.4]),
  );
  const swapped: number[][] = [
    [0, 1],
    [1, 0],
  ];
  TestValidator.predicate(
    "a zero leading entry is pivoted",
    close(AutoMovieEngineMath.prepareLinearSystem(swapped)?.([2, 3]) ?? null, [3, 2]) &&
      close(AutoMovieEngineMath.solveLinearSystem(swapped, [2, 3]), [3, 2]),
  );
  const dependent: number[][] = [
    [1, 2],
    [2, 4],
  ];
  TestValidator.equals(
    "dependent rows are singular",
    [
      AutoMovieEngineMath.prepareLinearSystem(dependent),
      AutoMovieEngineMath.solveLinearSystem(dependent, [1, 2]),
    ],
    [null, null],
  );
  TestValidator.predicate(
    "the pivot threshold is relative to the matrix's scale",
    close(
      AutoMovieEngineMath.prepareLinearSystem([
        [1e-20, 0],
        [0, 2e-20],
      ])?.([1e-20, 4e-20]) ?? null,
      [1, 2],
    ),
  );
  TestValidator.equals(
    "the empty system solves to the empty vector",
    AutoMovieEngineMath.prepareLinearSystem([])?.([]) ?? null,
    [],
  );
}
