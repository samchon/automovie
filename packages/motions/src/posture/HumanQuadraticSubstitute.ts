import type { HumanQuadraticWorkspace as Work } from "./HumanQuadraticWorkspace";

/**
 * Solve U-transpose U x=b by the original two banded triangular sweeps.
 * Upper row i stores U(i,i+j) for j in [0,min(band,n-1-i)]; forward
 * row i stores its finalized U(t,i) in increasing t order. The same finite
 * nonsingular factor serves ADMM and every active-set refinement step.
 *
 * @param factor Canonical upper factor plus exact forward-row copies from the same completed Cholesky recurrence; its n matches both vectors.
 * @param b Right-hand side, read before its corresponding destination entry is overwritten.
 * @param x Caller-owned destination, distinct from the factor.
 * @param relaxed Optional distinct n-entry vector updated as alpha*x+(1-alpha)*old after each final x component is produced; it must alias neither b nor x.
 * @param alpha Finite relaxation coefficient, one by default; ADMM supplies its existing 1.6.
 * @returns Whether every final solution component is finite; the flag does not admit or clamp a value.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Standard forward substitution solves U-transpose then backward substitution solves U; compatible dimensions and a finite nonsingular Cholesky factor are the existing caller premises.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the same two ordered sweeps for Band and active polishing; forward reads exact contiguous coefficient copies, while backward emits final-value finiteness and optional componentwise relaxation at their producer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every original term, subtraction/division association, band limit and diagonal use without a new numerical guard or skipped coefficient.
 * @evidence contracts/development/implementation.md#efficient-algorithms With w=band+1, takes O(n*w) time and O(1) auxiliary storage; final scalar emission avoids another complete ADMM relaxation walk, while row lengths encode both traversal bounds.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads unchanged upper/forward copies across right-hand sides, preserving every original term and order, including zeros/nonfinite propagation. Final values supply finiteness and independent-component relaxation immediately, without a stored answer or reciprocal.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates no arrays and changes only caller-owned x plus optional distinct relaxed; retains no input, matrix, state or resource after returning.
 * @evidence contracts/development/common.md#meaningful-documentation States the factored equation, upper/forward mappings, matching-factor and relaxation-nonaliasing premises, finite flag and output ownership.
 */
export function HumanQuadraticSubstitute(
  factor: Work.IFactor,
  b: Float64Array,
  x: Float64Array,
  relaxed?: Float64Array,
  alpha: number = 1,
): boolean {
  const n: number = factor.n;
  const u: Float64Array[] = factor.system;
  const forward: Float64Array = factor.forward;
  const starts: Float64Array = factor.forwardStart;
  for (let i: number = 0; i < n; ++i) {
    let v: number = b[i]!;
    const start: number = starts[i]!;
    const length: number = starts[i + 1]! - start;
    const first: number = i - length;
    for (let j: number = 0; j < length; ++j)
      v -= forward[start + j]! * x[first + j]!;
    x[i] = v / u[i]![0]!;
  }
  let finite: boolean = true;
  for (let i: number = n - 1; i >= 0; --i) {
    const row: Float64Array = u[i]!;
    let v: number = x[i]!;
    const end: number = i + row.length;
    for (let t: number = i + 1; t < end; ++t)
      v -= row[t - i]! * x[t]!;
    const value: number = v / row[0]!;
    x[i] = value;
    if (!Number.isFinite(value)) finite = false;
    if (relaxed !== undefined)
      relaxed[i] = alpha * value + (1 - alpha) * relaxed[i]!;
  }
  return finite;
}

