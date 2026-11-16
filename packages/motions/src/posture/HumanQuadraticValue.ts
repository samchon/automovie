import type { HumanQuadraticProgram as Q } from "./HumanQuadraticProgram";

/**
 * Evaluate the existing quadratic and exact soft-interval l1 objective.
 * Omitting x means the exact zero vector of an already admitted finite
 * problem: every curvature/linear term and ordered row product then adds
 * only signed zero to positive zero, leaving the same positive-zero sums.
 * This origin entry does not itself admit or certify any problem data.
 *
 * @param problem Compatible admitted finite curvature, q and row coefficients with valid, possibly unbounded ordered intervals.
 * @param x Current finite variable values, or the exact origin when absent.
 * @param observe Optional synchronous read-only consumer of each soft row's actual interval excess, in row order; it must not mutate the problem or x.
 * @param curvatureBand Actual upper curvature bandwidth, independent of row coupling; a narrower value requires exact zero entries outside it, as the fit's private diagonal producer guarantees.
 * @returns The objective in the original cost units, with the original overflow behavior.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Uses the original upper-band quadratic traversal and soft l1 penalty; at the admitted origin, finite coefficients times zero produce the same zero accumulators without reading their products again.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One numerical owner serves public QP.value and the fit's admitted-origin and actual-step reads; an optional local observer consumes the very same computed soft-row excess.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps all nonzero coefficients, duplicates, scalar associations and interval expressions. Only finite x permits exact-zero omission, whose signed-zero addends leave the positive-zero accumulators unchanged; nonfinite x retains the original full traversal. Narrow curvature bands still require the owning producer's exact-zero premise; no tolerance or overflow result changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms With w=curvatureBand+1, m rows and R soft-row entries, evaluation costs O(n*w+R+m), including one O(n) finite-x proof; finite x avoids multiplications and vector reads for exact-zero off-diagonal/row coefficients. Private diagonal fits use w=1, origin costs O(m), and no numeric scratch is allocated.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares each actual ordered row product/excess with same-call diagnostics and each current xi/P row across its curvature terms. One finite-x proof permits exact-zero products to be omitted; origin products are already proved zero. Every mutable problem/trial is read anew, without retained values or changed nonzero summation order.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds only scalar accumulators and synchronous borrowed inputs; retains no problem, vector, observer, model or result after returning.
 * @evidence contracts/development/common.md#meaningful-documentation Defines both evaluation modes, the finite-admission proof, units, ordered soft-row observer, side-effect premise and retained-data lifetime.
 */
export function HumanQuadraticValue(
  problem: Q.IProblem,
  x?: Float64Array,
  observe?: (row: Q.IRow, miss: number) => void,
  curvatureBand: number = problem.band,
): number {
  let v: number = 0;
  const finite: boolean = x === undefined || x.every(Number.isFinite);
  if (x !== undefined)
    for (let i: number = 0; i < problem.n; ++i) {
      const xi: number = x[i]!;
      const row: Float64Array = problem.p[i]!;
      v += problem.q[i]! * xi;
      v += 0.5 * row[0]! * xi * xi;
      const end: number = Math.min(curvatureBand, problem.n - 1 - i);
      for (let j: number = 1; j <= end; ++j) {
        const coefficient: number = row[j]!;
        if (!finite || coefficient !== 0) v += coefficient * xi * x[i + j]!;
      }
    }
  for (const row of problem.rows) {
    if (row.weight === undefined) continue;
    let s: number = 0;
    if (x !== undefined)
      for (let a: number = 0; a < row.index.length; ++a) {
        const coefficient: number = row.coef[a]!;
        if (!finite || coefficient !== 0) s += coefficient * x[row.index[a]!]!;
      }
    const miss: number = Math.max(0, row.l - s, s - row.u);
    v += row.weight * miss;
    observe?.(row, miss);
  }
  return v;
}
