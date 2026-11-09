/**
 * Point-eliminated original camera rows and retained upper point blocks.
 *
 * @evidence contracts/development/design.md#principled-representation Orthogonal point-first elimination preserves the same augmented least-squares objective in consistently scaled coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named local output joins reduced camera solving with point back substitution and optional metric retention.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The triangular data is not a normal matrix, inverse or data-rank certificate.
 * @evidence contracts/development/common.md#meaningful-documentation Members define camera rows, transformed right side and ordered upper block layout.
 */
export interface IAutoMovieRecoveryMapElimination {
  /** Reduced camera-only rows, including authored damping rows when requested. */
  rows: number[][];

  /** Transformed minus-residual in matching row order. */
  right: number[];

  /** Three upper point rows followed by C camera coefficients and one right value per landmark. */
  triangular: number[][][];
}
