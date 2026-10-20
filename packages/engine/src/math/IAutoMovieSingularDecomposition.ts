/**
 * Column-oriented factors of a bounded real matrix, A = U diag(s) V transpose.
 * Singular values descend. Right columns form a full basis, including a wide
 * matrix's nullspace. Nonzero left columns have unit length; orthogonality below
 * the reported relative cutoff is unresolved. Exact zero columns are zero.
 *
 * @evidence contracts/common.md#principled-implementation Separates original-design singular factors from an operational numerical-rank cutoff; small singular values are retained rather than replaced by eigenvalues of a squared-condition normal matrix.
 * @evidence contracts/common.md#clear-and-simple-design Column storage matches the rotations and lets consumers use right null vectors without transposition or a separate factorization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No covariance, full relative-accuracy guarantee or exact algebraic rank is inferred from a floating cutoff.
 * @evidence contracts/common.md#meaningful-documentation Gives factor orientation, ordering, unresolved small-column orthogonality and the meaning of the measured residual.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This owned result performs no decomposition.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache or coordination.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns n singular values, n left columns of length m and n right columns of length n; there is no external handle.
 * @author Samchon
 */
export interface IAutoMovieSingularDecomposition {
  /** Nonnegative descending values in the original matrix's units. */
  singularValues: number[];

  /** One length-m left vector per singular value; exact zero values have zero vectors. */
  leftColumns: number[][];

  /** One length-n right vector per singular value, including numerical null directions. */
  rightColumns: number[][];

  /** Count above the reported cutoff times the largest singular value, not exact rank. */
  numericalRank: number;

  /** Relative cutoff below which left-column orthogonality is not qualified. */
  relativeNullCutoff: number;

  /** Requested maximum absolute normalized dot product of active left columns. */
  orthogonalityTolerance: number;

  /** Measured maximum normalized column dot product on the final rotation-free sweep. */
  maximumActiveColumnCorrelation: number;

  /** Actual completed cyclic sweeps; an exhausted unconverged attempt throws. */
  sweeps: number;

  /** Measured Frobenius reconstruction error divided by the original norm, zero for a zero matrix. */
  relativeReconstructionResidual: number;
}
