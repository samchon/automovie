import { prepareLinearSystem } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `prepareLinearSystem` factors a square matrix once with partial pivoting and
 * returns a solver for any right-hand side, or null when a pivot vanishes;
 * `prepareLinearSystem.solve` answers one system the same way.
 *
 * Scenarios:
 *
 * 1. 2x + y = 3, x + 3y = 5 gives (0.8, 1.4), from the prepared solver and from
 *    `solve` alike, and the prepared solver answers a second right-hand side
 *    (1, 3) with (0, 1).
 * 2. A zero leading entry, [[0, 1], [1, 0]], is pivoted: (2, 3) gives (3, 2).
 * 3. Dependent rows [[1, 2], [2, 4]] are singular: null from both.
 * 4. The empty system solves to the empty vector.
 */
export function test_unit_engine_math_prepare_linear_system(): void {
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
    prepareLinearSystem(rows);
  TestValidator.predicate(
    "the prepared solver and solve agree on every right-hand side",
    solver !== null &&
      close(solver([3, 5]), [0.8, 1.4]) &&
      close(solver([1, 3]), [0, 1]) &&
      close(prepareLinearSystem.solve(rows, [3, 5]), [0.8, 1.4]),
  );
  const swapped: number[][] = [
    [0, 1],
    [1, 0],
  ];
  TestValidator.predicate(
    "a zero leading entry is pivoted",
    close(prepareLinearSystem(swapped)?.([2, 3]) ?? null, [3, 2]) &&
      close(prepareLinearSystem.solve(swapped, [2, 3]), [3, 2]),
  );
  const dependent: number[][] = [
    [1, 2],
    [2, 4],
  ];
  TestValidator.equals(
    "dependent rows are singular",
    [
      prepareLinearSystem(dependent),
      prepareLinearSystem.solve(dependent, [1, 2]),
    ],
    [null, null],
  );
  TestValidator.equals(
    "the empty system solves to the empty vector",
    prepareLinearSystem([])?.([]) ?? null,
    [],
  );
}
