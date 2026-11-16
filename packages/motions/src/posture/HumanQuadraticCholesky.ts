/**
 * Cholesky factor of a symmetric positive-definite banded matrix, using the
 * standard triangular recurrence. The OSQP reduced systems supply this
 * premise through convex curvature and positive regularization (Stellato
 * et al. 2020, section 3.1). The input stores K(i,i+j) in k[i][j] and is
 * overwritten with U in the same upper-band layout, where K=UᵀU. This is
 * the in-place storage principle documented by LAPACK DPBTF2:
 * https://www.netlib.org/lapack/explore-html/d4/d16/group__pbtf2_ga0dfc5e60d7f185bf4723a1d45eb4f153.html
 *
 * The original i/j/t scalar recurrence is preserved: L(i,j) is stored at
 * k[j][i-j]. Its system entry is still untouched when first read, while
 * earlier factor entries are available at k[t][i-t] and k[t][j-t].
 *
 * The inherited 1e-300 diagonal-radicand floor is unchanged. It does not
 * validate positive definiteness or certify finite numerical results;
 * the quadratic solver retains its existing factor and residual admission.
 *
 * @param k Owned finite canonical upper-band system, overwritten by its upper factor.
 * @param n Nonnegative integer variable count, equal to k.length.
 * @param band Nonnegative integer half-bandwidth of the system.
 * @returns The same buffer storing U, read by both triangular substitutions.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Applies the standard band-limited Cholesky recurrence to the reduced positive-definite OSQP system; compatible finite storage and positive definiteness remain caller premises.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the original triangular recurrence for both Band consumers while reusing the upper system as U storage; Workspace.system owns independent allocation and full reset.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the existing arithmetic order and 1e-300 diagonal-radicand guard; the guard is neither a convexity test nor a replacement for residual admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms With w=band+1, takes O(n*w*w) time and O(1) auxiliary storage beyond one O(n*w) band, allocating no arrays or separate lower matrix; runtime speed is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Overwrites each original system entry only after reading it, then reads earlier factor entries through the exact L-to-U index mapping; changed systems are fully reset before this call.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Mutates and returns only the caller-owned system buffer, retaining no global state; immutable initial factors and mutable solve factors receive independent allocations.
 * @evidence contracts/development/common.md#meaningful-documentation Defines upper storage, the L-to-U index mapping, in-place overwrite, caller premises, unchanged numerical guard and factor consumers.
 */
export function HumanQuadraticCholesky(
  k: Float64Array[],
  n: number,
  band: number,
): Float64Array[] {
  for (let i: number = 0; i < n; ++i) {
    const first: number = Math.max(0, i - band);
    for (let j: number = first; j <= i; ++j) {
      const row: Float64Array = k[j]!;
      let v: number = row[i - j]!;
      for (let t: number = first; t < j; ++t) {
        const previous: Float64Array = k[t]!;
        v -= previous[i - t]! * previous[j - t]!;
      }
      if (i === j) row[0] = Math.sqrt(Math.max(v, 1e-300));
      else row[i - j] = v / row[0]!;
    }
  }
  return k;
}
