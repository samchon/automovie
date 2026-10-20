/**
 * Identity of one fixed image used by a fit.
 *
 * @evidence contracts/common.md#principled-implementation The capture identifier and recorded SHA-256 carry the supplied identity of one training image.
 * @evidence contracts/common.md#clear-and-simple-design Source identity stays in fit evidence rather than becoming a source-image dependency of generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An image hash does not prove camera calibration, segmentation or geometric fidelity.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes capture identity from the SHA-256 of its encoded image bytes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The contract owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Values belong to the caller; the type acquires no resources.
 */
export interface IAutoMovieRecoveryImageSource {
  /** Fixed capture identity from the observation artifact. */
  id: string;

  /** Recorded SHA-256 of the original encoded image bytes. */
  sha256: string;
}
