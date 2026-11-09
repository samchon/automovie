/**
 * Fixed-background foreground classification for resident sRGB images.
 * A pixel is foreground when its maximum absolute channel distance reaches the threshold.
 *
 * @evidence contracts/development/design.md#principled-representation A declared RGB reference and channel-distance threshold specify the deterministic foreground predicate; shadows and similar foreground colours remain acquisition limitations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named classification record is independent of camera calibration and scan budgets.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No trained segmentation, per-object mask or hidden background estimate is supplied.
 * @evidence contracts/development/common.md#meaningful-documentation Defines byte channels, inclusive threshold comparison and the supported positive threshold range.
 */
export interface IAutoMovieRecoveryImageBackground {
  /** Fixed sRGB reference channels, each an integer in [0, 255]. */
  rgb: [number, number, number];

  /** Positive channel-distance threshold at most 255; equality marks foreground. */
  threshold: number;
}
