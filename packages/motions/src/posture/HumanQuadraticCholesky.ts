import type { HumanQuadraticWorkspace as Work } from "./HumanQuadraticWorkspace";

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
 * earlier factor entries are available as exact forward-row copies of
 * k[t][i-t] and k[t][j-t]. Each finalized off-diagonal value is copied in
 * the same operation, so the recurrence and repeated forward solves read
 * contiguous coefficients in the original increasing-t order.
 *
 * The inherited 1e-300 diagonal-radicand floor is unchanged. It does not
 * validate positive definiteness or certify finite numerical results;
 * the quadratic solver retains its existing factor and residual admission.
 *
 * @param matrices Owned finite canonical upper system and matching preallocated forward rows, with nonnegative integer n/band and compatible row lengths.
 * @returns The same owner storing U and exact mirrored lower coefficients.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Applies the standard band-limited Cholesky recurrence to the reduced positive-definite OSQP system; compatible finite storage and positive definiteness remain caller premises.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the original triangular recurrence for both factor consumers, reusing the upper system as U and copying each finalized off-diagonal value into its preallocated forward row; Workspace owns allocation and reset.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the existing arithmetic order and 1e-300 diagonal-radicand guard; the guard is neither a convexity test nor a replacement for residual admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms With w=band+1, takes O(n*w*w) time and O(1) auxiliary storage beyond the caller's two O(n*w) coefficient layouts; each finalized value adds one copy and repeated forward solves avoid scattered upper-row reads. Runtime speed is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each off-diagonal result is copied exactly, including signed zero or nonfinite values, into its forward position once; preceding outer rows and preceding current-row columns are finalized before the recurrence reads those copies in increasing t order. Changed systems reset upper storage and overwrite every forward entry.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Mutates and returns only the caller-owned system buffer, retaining no global state; immutable initial factors and mutable solve factors receive independent allocations.
 * @evidence contracts/development/common.md#meaningful-documentation Defines upper storage, mirrored forward rows, the L-to-U mapping, in-place recurrence, caller premises and unchanged numerical guard.
 */
export function HumanQuadraticCholesky(
  matrices: Work.IFactor,
): Work.IFactor {
  const { n, band, system: k, forward }: Work.IFactor = matrices;
  for (let i: number = 0; i < n; ++i) {
    const first: number = Math.max(0, i - band);
    const lower: Float64Array = forward[i]!;
    for (let j: number = first; j <= i; ++j) {
      const row: Float64Array = k[j]!;
      let v: number = row[i - j]!;
      const previous: Float64Array = forward[j]!;
      const shared: number = j - first;
      const offset: number = previous.length - shared;
      for (let a: number = 0; a < shared; ++a)
        v -= lower[a]! * previous[offset + a]!;
      if (i === j) row[0] = Math.sqrt(Math.max(v, 1e-300));
      else {
        const value: number = v / row[0]!;
        row[i - j] = value;
        lower[j - first] = value;
      }
    }
  }
  return matrices;
}

