

/**
 * Frame-directory and count shared by an ordered guide-pass request. planGuidePassOutputs validates the positive count and supported pass strings through normalizeGuidePasses, preserving its normalization/order rules. Beauty uses untagged names; other passes receive tags.
 *
 * @evidence contracts/development/design.md#principled-representation Beauty uses untagged names; other passes receive tags.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planGuidePassOutputs exchanges frameDir, frameCount, passes; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Beauty uses untagged names; other passes receive tags.
 * @evidence contracts/development/common.md#meaningful-documentation Frame-directory and count shared by an ordered guide-pass request. planGuidePassOutputs validates the positive count and supported pass strings through normalizeGuidePasses, preserving its normalization/order rules. The prose and members document how planGuidePassOutputs interprets and admits these values.
 */
export interface IAutoMoviePlanGuidePassOutputsProps {
  /** Directory where the render's frame files are written. */
  frameDir: string;

  /** Number of frames each pass captures; a positive integer. */
  frameCount: number;

  /** Requested passes, in capture order. */
  passes: readonly string[];
}
