/**
 * Solve U-transpose U x=b by the original two banded triangular sweeps.
 * Row i stores U(i,i+j) for j in [0,min(band,n-1-i)]. The same finite
 * nonsingular factor serves ADMM and every active-set refinement step.
 *
 * @param u Canonical upper factor with min(band+1,n-i) entries per row.
 * @param n Nonnegative variable count, matching all vectors.
 * @param band Nonnegative half-bandwidth.
 * @param b Right-hand side, read before its corresponding destination entry is overwritten.
 * @param x Caller-owned destination, distinct from the factor.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Standard forward substitution solves U-transpose then backward substitution solves U; compatible dimensions and a finite nonsingular Cholesky factor are the existing caller premises.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns both original ordered sweeps for the Band facade and active polishing, separately from matrix assembly, factorization and residual diagnostics.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every original term, subtraction/division association, band limit and diagonal use without a new numerical guard or skipped coefficient.
 * @evidence contracts/development/implementation.md#efficient-algorithms With w=band+1, takes O(n*w) time including diagonal systems and O(1) auxiliary storage beyond the supplied destination; row lengths encode the backward bound.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the unchanged factor across successive right-hand sides while rebuilding every current solution; no previous iterate, solution or reciprocal is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates no arrays, changes only caller-owned x and retains no input, matrix, state or resource after returning.
 * @evidence contracts/development/common.md#meaningful-documentation States the factored equation, upper-band mapping, unchanged numerical premises, actual consumers and destination ownership.
 */
export function HumanQuadraticSubstitute(
  u: Float64Array[],
  n: number,
  band: number,
  b: Float64Array,
  x: Float64Array,
): void {
  for (let i: number = 0; i < n; ++i) {
    let v: number = b[i]!;
    for (let t: number = Math.max(0, i - band); t < i; ++t)
      v -= u[t]![i - t]! * x[t]!;
    x[i] = v / u[i]![0]!;
  }
  for (let i: number = n - 1; i >= 0; --i) {
    const row: Float64Array = u[i]!;
    let v: number = x[i]!;
    const end: number = i + row.length;
    for (let t: number = i + 1; t < end; ++t)
      v -= row[t - i]! * x[t]!;
    x[i] = v / row[0]!;
  }
}
