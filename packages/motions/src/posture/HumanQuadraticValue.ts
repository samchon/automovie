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
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every potentially nonzero coefficient, duplicate, scalar association and interval expression; omitted curvature entries must be exact zeros by the owning producer, finite admission precedes the origin/diagonal paths, and no constraint band, tolerance or overflow result is changed.
 * @evidence contracts/development/implementation.md#efficient-algorithms With w=curvatureBand+1, m rows and R soft-row entries, current-x evaluation costs O(n*w+R+m); the private diagonal fit uses w=1, the admitted origin costs O(m), and no zero vector or numeric scratch is allocated.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares each actual ordered row product and interval excess between the objective and same-call model diagnostics; the origin avoids only products already known to be zero, and every mutable problem/trial is otherwise read anew.
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
  if (x !== undefined)
    for (let i: number = 0; i < problem.n; ++i) {
      v += problem.q[i]! * x[i]!;
      v += 0.5 * problem.p[i]![0]! * x[i]! * x[i]!;
      for (let j: number = 1; j <= curvatureBand && i + j < problem.n; ++j)
        v += problem.p[i]![j]! * x[i]! * x[i + j]!;
    }
  for (const row of problem.rows) {
    if (row.weight === undefined) continue;
    let s: number = 0;
    if (x !== undefined)
      for (let a: number = 0; a < row.index.length; ++a)
        s += row.coef[a]! * x[row.index[a]!]!;
    const miss: number = Math.max(0, row.l - s, s - row.u);
    v += row.weight * miss;
    observe?.(row, miss);
  }
  return v;
}
