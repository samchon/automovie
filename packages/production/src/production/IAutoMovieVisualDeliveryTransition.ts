

/**
 * Declared review of one adjacent unlike-lane crossing. The planner compares endpoints in timeline order and admits SHA-256 syntax for reviewDigest; it does not load a review artifact or independently observe the crossing.
 *
 * @evidence contracts/common.md#principled-implementation Ordered from/to occurrence IDs address one actual crossing rather than the potentially repeated shot pair.
 * @evidence contracts/common.md#clear-and-simple-design The transition carries compact review metadata; lane planning supplies adjacency and observation policy supplies aggregate context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A review digest remains an authored assertion whose artifact/content is not verified by the transition schema or planner.
 * @evidence contracts/common.md#meaningful-documentation Prose states directed adjacency, timeline ordering and the digest-versus-observation boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record executes no crossing derivation, hash or artifact read.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Endpoint/digest fields implement no review cache or repeated playback coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased interface acquires no review bytes, browser or playback task.
 * @author Samchon
 */
export interface IAutoMovieVisualDeliveryTransition {
  /** Occurrence the crossing leaves. */
  fromOccurrence: string;

  /** Occurrence the crossing enters. */
  toOccurrence: string;

  /** Digest of the review that approved this exact crossing. */
  reviewDigest: string;
}
