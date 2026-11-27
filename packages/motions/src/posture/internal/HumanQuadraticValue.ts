import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

/*
 * Evaluate the existing quadratic and exact soft-interval l1 objective.
 * Omitting x means the exact zero vector of an already admitted finite problem:
 * every curvature/linear term and ordered row product then adds only signed
 * zero to positive zero, leaving the same positive-zero sums. This origin entry
 * does not itself admit or certify any problem data.
 * Parameter problem: Compatible admitted finite curvature, q and row coefficients
 * with valid, possibly unbounded ordered intervals.
 * Parameter x: Current finite variable values, or the exact origin when absent.
 * Parameter observe: Optional synchronous read-only consumer of each soft row's
 * actual interval excess, in row order; it must not mutate the problem or x.
 * Parameter curvatureBand: Actual upper curvature bandwidth, independent of row
 * coupling; a narrower value requires exact zero entries outside it, as the
 * fit's private diagonal producer guarantees.
 * Returns: The objective in the original cost units, with the original overflow
 * behavior.
 */
export function HumanQuadraticValue(
  problem: IAutoMovieMotionHumanQuadraticProgram.IProblem,
  x?: Float64Array,
  observe?: (
    row: IAutoMovieMotionHumanQuadraticProgram.IRow,
    miss: number,
  ) => void,
  curvatureBand: number = problem.band,
): number {
  let v: number = 0;
  if (x !== undefined)
    for (let i: number = 0; i < problem.n; ++i) {
      const xi: number = x[i]!;
      const row: Float64Array = problem.p[i]!;
      v += problem.q[i]! * xi;
      v += 0.5 * row[0]! * xi * xi;
      const end: number = Math.min(curvatureBand, problem.n - 1 - i);
      for (let j: number = 1; j <= end; ++j) {
        const coefficient: number = row[j]!;
        if (coefficient !== 0) v += coefficient * xi * x[i + j]!;
      }
    }
  for (const row of problem.rows) {
    if (row.weight === undefined) continue;
    let s: number = 0;
    if (x !== undefined)
      for (let a: number = 0; a < row.index.length; ++a) {
        const coefficient: number = row.coef[a]!;
        if (coefficient !== 0) s += coefficient * x[row.index[a]!]!;
      }
    const miss: number = Math.max(0, row.l - s, s - row.u);
    v += row.weight * miss;
    observe?.(row, miss);
  }
  return v;
}
