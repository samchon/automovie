/**
 * Frame-directory and count shared by an ordered guide-pass request.
 * planGuidePassOutputs validates the positive count and supported pass strings
 * through normalizeGuidePasses, preserving its normalization/order rules.
 * Beauty uses untagged names; other passes receive tags.
 */
export interface IAutoMoviePlanGuidePassOutputsProps {
  /** Directory where the render's frame files are written. */
  frameDir: string;

  /** Number of frames each pass captures; a positive integer. */
  frameCount: number;

  /** Requested passes, in capture order. */
  passes: readonly string[];
}
