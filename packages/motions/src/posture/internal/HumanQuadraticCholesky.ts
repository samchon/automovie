import type { HumanQuadraticWorkspace as Work } from "./HumanQuadraticWorkspace";

/*
 * Cholesky factor of a symmetric positive-definite banded matrix, using the
 * standard triangular recurrence. The OSQP reduced systems supply this premise
 * through convex curvature and positive regularization (Stellato et al. 2020,
 * section 3.1). The input stores K(i,i+j) in k[i][j] and is overwritten with U
 * in the same upper-band layout, where K=UᵀU. This is the in-place storage
 * principle documented by LAPACK DPBTF2:
 * https://www.netlib.org/lapack/explore-html/d4/d16/group__pbtf2_ga0dfc5e60d7f185bf4723a1d45eb4f153.html
 *
 * The original i/j/t scalar recurrence is preserved: L(i,j) is stored at
 * k[j][i-j]. Its system entry is still untouched when first read, while earlier
 * factor entries are available as exact forward-row copies of k[t][i-t] and
 * k[t][j-t]. Each finalized off-diagonal value is copied in the same operation,
 * so the recurrence and repeated forward solves read contiguous coefficients in
 * the original increasing-t order.
 *
 * The inherited 1e-300 diagonal-radicand floor is unchanged. It does not
 * validate positive definiteness or certify finite numerical results; the
 * quadratic solver retains its existing factor and residual admission.
 *
 * With `dependent`, the modified factorisation of interior-point methods
 * (Wright 1999, "Modified Cholesky factorizations in interior-point algorithms
 * for linear programming", SIAM J Optim 9:1159): a radicand no more than
 * `dependent` of its own diagonal entry before elimination has lost every digit
 * to cancellation, its row of the system depending on the rows before it to
 * rounding, so its pivot is set to `SKIP` instead, and the step leaves that
 * direction where the other rows put it. An interior method's reduced system
 * grows such rows as its iterates near the solution (a constraint's weight
 * `lambda / t` without bound), where the 1e-300 floor would divide the factor
 * by 1e-150 and overflow it.
 * Parameter matrices: Owned finite canonical upper system and matching preallocated
 * forward rows, with nonnegative integer n/band and compatible row lengths.
 * Parameter dependent: The share of a diagonal entry under which its radicand is
 * taken for a dependent row (`SKIP`); absent, the 1e-300 floor alone.
 * Returns: The same owner storing U and exact mirrored lower coefficients.
 */
export function HumanQuadraticCholesky(
  matrices: Work.IFactor,
  dependent?: number,
): Work.IFactor {
  const { n, band, system: k, forward, forwardStart }: Work.IFactor = matrices;
  for (let i: number = 0; i < n; ++i) {
    const first: number = Math.max(0, i - band);
    const lower: number = forwardStart[i]!;
    for (let j: number = first; j <= i; ++j) {
      const row: Float64Array = k[j]!;
      let v: number = row[i - j]!;
      const shared: number = j - first;
      const previous: number = forwardStart[j + 1]! - shared;
      for (let a: number = 0; a < shared; ++a)
        v -= forward[lower + a]! * forward[previous + a]!;
      if (i === j)
        row[0] =
          dependent !== undefined && !(v > dependent * row[0]!)
            ? SKIP
            : Math.sqrt(Math.max(v, 1e-300));
      else {
        const value: number = v / row[0]!;
        row[i - j] = value;
        forward[lower + j - first] = value;
      }
    }
  }
  return matrices;
}

/*
 * A dependent row's pivot, the square root of Wright's (1999) huge diagonal
 * 1e64: its factor entries and its step's component vanish to rounding.
 */
const SKIP: number = 1e32;
