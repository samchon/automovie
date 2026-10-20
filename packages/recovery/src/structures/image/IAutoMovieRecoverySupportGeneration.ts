/**
 * Generation counts and a numerical boundary defect, without hidden-surface qualification.
 *
 * @evidence contracts/common.md#principled-implementation Actual event, interval and vertex counts accompany the generated support boundary's numerical discrepancy.
 * @evidence contracts/common.md#clear-and-simple-design Numerical generation evidence is separate from observations and from hidden-surface coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts and a boundary discrepancy do not certify enclosure or reveal hidden concavities.
 * @evidence contracts/common.md#meaningful-documentation States each counted population and the metre unit of the maximum boundary discrepancy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The contract owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Values belong to the caller; the type acquires no resources.
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
