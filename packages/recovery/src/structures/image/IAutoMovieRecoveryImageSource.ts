/**
 * Identity of one fixed image used by a fit.
 *
 * @evidence contracts/development/design.md#principled-representation The capture identifier and recorded SHA-256 carry the supplied identity of one training image.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Source identity stays in fit evidence rather than becoming a source-image dependency of generation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An image hash does not prove camera calibration, segmentation or geometric fidelity.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes capture identity from the SHA-256 of its encoded image bytes.
 */
export interface IAutoMovieRecoveryImageSource {
  /** Fixed capture identity from the observation artifact. */
  id: string;

  /** Recorded SHA-256 of the original encoded image bytes. */
  sha256: string;
}
