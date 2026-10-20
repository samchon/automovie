/**
 * Orthogonally compressed least-squares objective in unchanged variables.
 * For every x, ||A*x-b||^2 equals ||rows*x-right||^2 plus the squared
 * orthogonalResidualNorm, to floating arithmetic accuracy. No rank is claimed.
 *
 * @evidence contracts/common.md#principled-implementation The upper original design and transformed right side retain the variable objective while the orthogonal residual is independent of x; no normal matrix or inverse represents the result.
 * @evidence contracts/common.md#clear-and-simple-design One named generic result carries the actual numerical output and separate work diagnostic consumed by original-design solvers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An upper triangle, tiny diagonal or finite residual is not a rank, covariance or physical-observability certificate.
 * @evidence contracts/common.md#meaningful-documentation Members define orientation, unchanged coordinate units, constant residual and actual transformed-cell count.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This owned result performs no decomposition.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns n*n upper entries, n right values and two scalars, without external handles.
 */
export interface IAutoMovieQrDesignReduction {
  /** n-by-n upper original design, including unresolved zero directions. */
  rows: number[][];

  /** Length-n transformed right side in the same objective's units. */
  right: number[];

  /** Nonnegative norm of the discarded x-independent orthogonal residual. */
  orthogonalResidualNorm: number;

  /** Actual design/right cells transformed, at most the admitted conservative bound. */
  transformedCells: number;
}
