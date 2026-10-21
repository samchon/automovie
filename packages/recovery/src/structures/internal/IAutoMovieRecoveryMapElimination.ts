/**
 * Point-eliminated original camera rows and retained upper point blocks.
 *
 * @evidence contracts/common.md#principled-implementation Orthogonal point-first elimination preserves the same augmented least-squares objective in consistently scaled coordinates.
 * @evidence contracts/common.md#clear-and-simple-design One named local output joins reduced camera solving with point back substitution and optional metric retention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The triangular data is not a normal matrix, inverse or data-rank certificate.
 * @evidence contracts/common.md#meaningful-documentation Members define camera rows, transformed right side and ordered upper block layout.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no elimination.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One model owns O(E*C+L*C) transformed scalars until solving or explicit factor transfer completes.
 */
export interface IAutoMovieRecoveryMapElimination {
  /** Reduced camera-only rows, including authored damping rows when requested. */
  rows: number[][];

  /** Transformed minus-residual in matching row order. */
  right: number[];

  /** Three upper point rows followed by C camera coefficients and one right value per landmark. */
  triangular: number[][][];
}
