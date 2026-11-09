/**
 * Generation counts and a numerical boundary defect, without hidden-surface qualification.
 *
 * @evidence contracts/development/design.md#principled-representation Actual event, interval and vertex counts accompany the generated support boundary's numerical discrepancy.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Numerical generation evidence is separate from observations and from hidden-surface coverage.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Counts and a boundary discrepancy do not certify enclosure or reveal hidden concavities.
 * @evidence contracts/development/common.md#meaningful-documentation States each counted population and the metre unit of the maximum boundary discrepancy.
 */
export interface IAutoMovieRecoverySupportGeneration {
  /** Number of generated support-envelope events. */
  events: number;

  /** Number of generated support intervals. */
  intervals: number;

  /** Number of generated mesh vertices. */
  vertices: number;

  /** Largest numerical boundary discrepancy, metres. */
  maximumBoundaryDefectMeters: number;
}
