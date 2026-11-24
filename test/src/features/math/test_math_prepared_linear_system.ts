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
 * 4. From boundary(2,0) and interior(1.5,0.5), projected tasks q0+q1=2 andq0+2q1=3 have
 *    unique interior answer(1,1). The lower-bound residual clips negative
 *    probes, so a projected finite difference must use its feasible span
 *    instead of halving that column and losing the real null direction. The interior start separately requires actual primary-null secondary motion without damping leakage.
 * 5. An empty variable set still projects and reads its actual primary
 *    residual. There is no invented variable or attempt to index a missing
 *    Jacobian column, even when the fixed primary residual is nonzero.
 * 6. An already met primary x=2 with empty or zero secondary stays at2;
 *    with the primary unmet, the same empty secondary still permits reaching2.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names actual public consumers, integer-system equations, mutable-input/output ownership, descent priority, empty-variable and zero-secondary boundaries, resolution and six scenarios without exporting an internal factor helper for tests.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public AutoMovieSolidVector.solve and fitDigitDescent, checks hand-derived roots and original residuals, observes unchanged caller data and earlier solutions, and verifies the actual prioritized repeated-right-hand-side consumer reaches the constrained task optimum. Fixed empty variables still reach owned projection/residual callbacks, and zero-secondary controls distinguish a met primary from a primary that must move.
 * @evidence contracts/development/testing.md#independent-expectations Matrix multiplication fixes the two integer roots. Task equations give(3,1); x+y=4 with x,y>=0 bounds x-y at4, giving constrained(4,0). Primary tolerance stays1e-6 and root agreement1e-5. A1e-7 variable step gives this linear primary at most2e-7 one-step motion, strictly below its requested1e-6 met bound, so resolution stopping cannot contradict that bound. Eliminating the boundary-case equations gives q1=1,q0=1; both tasks can be exactly met with nonnegative variables. Their feasible Jacobian rows are(1,1) and(1,2), making(-1,1) primary-null and secondary-active. A clipped central column scaled by the unprojected2h gives the wrong(1,0.5) primary row. The same original1e-6 primary/1e-5 variable bounds remain. The interior start has no clipped probe but an already met primary, separating null-space leakage from boundary differencing.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers pivot swaps, multiple/zero/repeated columns, input/output mutation, edited current source, singular/empty/singleton systems, a full null-space task and a bound-limited secondary with primary priority and a lower-bound start whose feasible null-space direction reaches an interior exact solution. Empty variables with a nonzero actual residual, zero versus absent secondary and met versus unmet primary distinguish both exact termination boundaries without imposing an internal retry count. Internal storage/work counters and general conditioning are outside this public semantic test.
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
      step: 1e-7,
      tolerance: (): number => 1e-6,
    });
    TestValidator.predicate(`priority bias=${bias}, result=(${result.join(",")}), primary=${result[0]! + result[1]! - 4}: reaches the independent constrained optimum`,
      result.length === 2 && nclose(result[0]!, expected[0], 1e-5) &&
      nclose(result[1]!, expected[1], 1e-5) &&
      Math.abs(result[0]! + result[1]! - 4) <= 1e-6 &&
      result.every((value: number): boolean => value >= 0 && value <= 10),
    );
  }
  TestValidator.predicate("digit descent does not mutate its original variable seed",
    start.every((value: number): boolean => nclose(value, 0, 0)),
  );
  const q: (x: readonly number[], index: number) => number = (x: readonly number[], index: number): number => Math.max(0, x[index]!);
  const primaryMetFindings: string[] = [];
  for (const initial of [[2, 0], [1.5, 0.5]] as const) {
    const probeStart: number[] = [...initial];
    const released: number[] = fitDigitDescent({
      start: probeStart,
      primary: (x: readonly number[]): number[] => [q(x, 0) + q(x, 1) - 2],
      secondary: (x: readonly number[]): number[] => [q(x, 0) + 2 * q(x, 1) - 3],
      project: (x: readonly number[]): number[] => x.map((value: number): number => Math.max(0, value)),
      step: 1e-7,
      tolerance: (): number => 1e-6,
    });
    if (!(released.length === 2 && released.every((value: number): boolean => value >= 0 && nclose(value, 1, 1e-5)) &&
      Math.abs(released[0]! + released[1]! - 2) <= 1e-6 && Math.abs(released[0]! + 2 * released[1]! - 3) <= 1e-5 &&
      nclose(probeStart[0]!, initial[0], 0) && nclose(probeStart[1]!, initial[1], 0)))
      primaryMetFindings.push(`primary-met start(${initial.join(",")}) must reach(1,1), actual=(${released.join(",")}), primary=${released[0]! + released[1]! - 2}, secondary=${released[0]! + 2 * released[1]! - 3}`);
  }
  TestValidator.equals("all boundary/interior primary-met cases retain the unchanged task bounds", primaryMetFindings, []);

  let emptyProjections: number = 0;
  let emptyResidualReads: number = 0;
  const fixed: number[] = fitDigitDescent({
    start: [],
    primary: (values: readonly number[]): number[] => {
      emptyResidualReads++;
      TestValidator.equals("a fixed task observes its actual empty projected variables", values, []);
      return [3, 4];
    },
    secondary: (): number[] => [],
    project: (values: readonly number[]): number[] => {
      emptyProjections++;
      return [...values];
    },
    step: 1e-7,
    tolerance: (): number => 1e-6,
  });
  TestValidator.equals("a task with no variables returns its exact empty point", fixed, []);
  TestValidator.predicate("an empty point still reaches its actual projector and nonzero primary residual",
    emptyProjections > 0 && emptyResidualReads > 0,
  );
  for (const [initial, zeroSecondary] of [[2, false], [2, true], [0, false]] as const) {
    const seed: number[] = [initial];
    const result: number[] = fitDigitDescent({
      start: seed,
      primary: (values: readonly number[]): number[] => [values[0]! - 2],
      secondary: (): number[] => zeroSecondary ? [0] : [],
      project: (values: readonly number[]): number[] => [...values],
      step: 1e-7,
      tolerance: (): number => 1e-6,
    });
    TestValidator.predicate(`zero secondary preserves primary semantics from${initial}, explicit${zeroSecondary}`,
      result.length === 1 && nclose(result[0]!, 2, 1e-6) && nclose(seed[0]!, initial, 0) && result !== seed,
    );
  }
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
