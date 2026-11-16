/**
 * Cholesky factor of a symmetric positive-definite banded matrix, using the
 * standard triangular recurrence. The OSQP reduced systems supply this
 * premise through convex curvature and positive regularization (Stellato
 * et al. 2020, section 3.1). The input stores K(i,i+j) in k[i][j]; the
 * result stores L(i,i-j) in l[i][j], with K = L Lᵀ in exact arithmetic.
 *
 * The inherited 1e-300 diagonal-radicand floor is unchanged. It does not
 * validate positive definiteness or certify finite numerical results;
 * the quadratic solver retains its existing factor and residual admission.
 *
 * @param k Finite upper-band matrix with the supplied in-range entries; read without mutation.
 * @param n Nonnegative integer variable count, equal to k.length.
 * @param band Nonnegative integer half-bandwidth of the stored system.
 * @returns A new lower-band factor, read by both ADMM and polishing substitutions.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Applies the standard band-limited Cholesky recurrence to the reduced positive-definite OSQP system; compatible finite storage and positive definiteness remain caller premises.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the unchanged triangular factorization once for HumanQuadraticBand.factor and HumanQuadraticBand.polish, independently of bodies, rows and preparation caches.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the existing arithmetic order and 1e-300 diagonal-radicand guard; the guard is neither a convexity test nor a replacement for residual admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms With w=band+1, takes O(n*w*w) time and O(n*w) output storage, including the diagonal band=0 case; no speed improvement is claimed for this extraction.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Produces the factor read by repeated substitutions; its consumers decide when a prepared system or one polishing system permits sharing that factor.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates one caller-owned banded factor and retains no matrix, body, plan or global state after returning.
 * @evidence contracts/development/common.md#meaningful-documentation Defines both band layouts, exact-arithmetic relation, caller premises, numerical guard, factor consumers and allocation ownership.
 */
export function HumanQuadraticCholesky(
  k: Float64Array[],
  n: number,
  band: number,
): Float64Array[] {
  const l: Float64Array[] = [];
  for (let i: number = 0; i < n; ++i) l.push(new Float64Array(band + 1));
  for (let i: number = 0; i < n; ++i)
    for (let j: number = Math.max(0, i - band); j <= i; ++j) {
      let v: number = k[j]![i - j]!;
      for (let t: number = Math.max(0, i - band); t < j; ++t)
        v -= l[i]![i - t]! * l[j]![j - t]!;
      if (i === j) l[i]![0] = Math.sqrt(Math.max(v, 1e-300));
      else l[i]![i - j] = v / l[j]![0]!;
    }
  return l;
}
