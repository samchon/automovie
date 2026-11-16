import { AutoMovieSolidVector, fitDigitDescent } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Public dense and prioritized-descent consumers preserve exact matrix
 * elimination semantics when their common owner prepares repeated solves.
 *
 * Scenarios:
 * 1. A zero first diagonal requires row pivoting. Literal right-hand sides
 *    give roots (1,2,-1) and (-2,1,3); A/B/A and zero columns preserve them.
 *    Matrix/right-hand-side inputs and earlier solution arrays remain owned.
 * 2. Editing the source matrix to identity affects a new public solve.
 *    Dependent/zero matrices reject, while empty and singleton systems retain
 *    their empty and signed-division meanings.
 * 3. The public digit descent prioritizes x+y=4, then x-y=2, giving (3,1).
 *    With nonnegative bounds and secondary x-y=8, it gives (4,0) without
 *    trading the primary sum for an infeasible secondary. This actual
 *    consumer solves one primary matrix for its step and null-space columns.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names actual public consumers, integer-system equations, mutable-input/output ownership, descent priority, resolution and the three scenarios without exporting an internal factor helper for tests.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public AutoMovieSolidVector.solve and fitDigitDescent, checks hand-derived roots and original residuals, observes unchanged caller data and earlier solutions, and verifies the actual prioritized repeated-right-hand-side consumer reaches the constrained task optimum.
 * @evidence contracts/development/testing.md#independent-expectations Multiplication gives (3,0,-1) from (1,2,-1) and (5,-13,-1) from (-2,1,3). The task equations solve to (3,1); imposing x+y=4 with x,y>=0 bounds x-y at4, making (4,0) the closest feasible secondary. Primary residual stays within its declared1e-6 tolerance and component/secondary checks within1e-5 for the declared1e-6 descent step.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers pivot swaps, multiple/zero/repeated columns, input/output mutation, edited current source, singular/empty/singleton systems, a full null-space task and a bound-limited secondary with primary priority. Internal storage/work counters and general conditioning are outside this public semantic test.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable unit owns finite arrays and actual public residual/projector callbacks. It imports no internal helper, changes no public API, starts no host/compiler and replaces no foreign function or global.
 */
export function test_math_prepared_linear_system(): void {
  const original: readonly (readonly number[])[] = [
    [0, 2, 1], [1, -2, -3], [3, -1, 2],
  ];
  const matrix: number[][] = original.map((row: readonly number[]): number[] => [...row]);
  const column: number[] = [3, 0, -1];
  const first: number[] | null = AutoMovieSolidVector.solve(matrix, column);
  solution("pivoted first column", first, [1, 2, -1]);
  if (first !== null) residual(original, first, column);
  const second: number[] | null = AutoMovieSolidVector.solve(matrix, [5, -13, -1]);
  solution("independent second column", second, [-2, 1, 3]);
  if (second !== null) residual(original, second, [5, -13, -1]);
  solution("zero column", AutoMovieSolidVector.solve(matrix, [0, 0, 0]), [0, 0, 0]);
  solution("repeated first column", AutoMovieSolidVector.solve(matrix, column), [1, 2, -1]);
  TestValidator.predicate("solver leaves source and supplied column unchanged",
    column.every((value: number, i: number): boolean => nclose(value, [3, 0, -1][i]!, 0)) &&
    matrix.every((row: number[], i: number): boolean => row.every((value: number, j: number): boolean =>
      nclose(value, original[i]![j]!, 0))),
  );
  if (first !== null) first[0] = 123;
  solution("caller output edits do not affect later solve", AutoMovieSolidVector.solve(matrix, column), [1, 2, -1]);
  solution("earlier second solution remains owned", second, [-2, 1, 3]);
  for (let row: number = 0; row < matrix.length; row++)
    for (let entry: number = 0; entry < matrix.length; entry++)
      matrix[row]![entry] = row === entry ? 1 : 0;
  solution("current source edits affect new public solve", AutoMovieSolidVector.solve(matrix, column), column);
  TestValidator.equals("dependent rows reject", AutoMovieSolidVector.solve([[1, 2], [2, 4]], [1, 2]), null);
  TestValidator.equals("zero matrix rejects", AutoMovieSolidVector.solve([[0, 0], [0, 0]], [0, 0]), null);
  TestValidator.equals("empty system has no invented component", AutoMovieSolidVector.solve([], []), []);
  solution("singleton signed division", AutoMovieSolidVector.solve([[-4]], [10]), [-2.5]);

  const start: number[] = [0, 0];
  for (const [bias, expected] of [[2, [3, 1]], [8, [4, 0]], [2, [3, 1]]] as const) {
    const result: number[] = fitDigitDescent({
      start,
      primary: (x: readonly number[]): number[] => [x[0]! + x[1]! - 4],
      secondary: (x: readonly number[]): number[] => [x[0]! - x[1]! - bias],
      project: (x: readonly number[]): number[] => x.map((value: number): number => Math.min(10, Math.max(0, value))),
      step: 1e-6,
      tolerance: (): number => 1e-6,
    });
    TestValidator.predicate("prioritized descent reaches its independent constrained optimum",
      result.length === 2 && nclose(result[0]!, expected[0], 1e-5) &&
      nclose(result[1]!, expected[1], 1e-5) &&
      Math.abs(result[0]! + result[1]! - 4) <= 1e-6 &&
      result.every((value: number): boolean => value >= 0 && value <= 10),
    );
  }
  TestValidator.predicate("digit descent does not mutate its original variable seed",
    start.every((value: number): boolean => nclose(value, 0, 0)),
  );
}

/** Compare finite roots to the independently derived system solution. */
function solution(label: string, actual: readonly number[] | null, expected: readonly number[]): void {
  TestValidator.predicate(label, actual !== null && actual.length === expected.length &&
    expected.every((value: number, i: number): boolean => nclose(actual[i]!, value, 1e-12)),
  );
}

/** Substitute each returned root into the original equations. */
function residual(matrix: readonly (readonly number[])[], x: readonly number[], b: readonly number[]): void {
  TestValidator.predicate("original equations retain their right-hand sides",
    matrix.every((row: readonly number[], i: number): boolean =>
      nclose(row.reduce((sum: number, value: number, j: number): number =>
        sum + value * x[j]!, 0), b[i]!, 1e-12)),
  );
}
