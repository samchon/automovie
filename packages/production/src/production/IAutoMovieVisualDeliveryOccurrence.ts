

/**
 * One delivered timeline occurrence, distinct from the shot identity that may repeat. Lane planning requires nonempty exact text, unique occurrence IDs and the same ordered occurrence/shot population on both sides.
 *
 * @evidence contracts/common.md#principled-implementation Separate occurrence and shot IDs preserve repeated uses of one shot in an exact ordered timeline join.
 * @evidence contracts/common.md#clear-and-simple-design The minimal pair identifies timeline placement without embedding source, receipt or review state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shot identity cannot substitute for occurrence identity; this interface alone enforces neither uniqueness nor current timeline membership.
 * @evidence contracts/common.md#meaningful-documentation Prose states repeatable shot versus unique occurrence and the planner's exact ordered population premise.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The pair shape performs no timeline traversal or duplicate detection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Identity fields implement no source or timeline result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased interface allocates no timeline array or receipt resource; its producer/consumer owns records.
 * @author Samchon
 */
export interface IAutoMovieVisualDeliveryOccurrence {
  /** Stable occurrence identity within the current film timeline. */
  occurrence: string;

  /** Shot the occurrence realizes. */
  shot: string;
}
