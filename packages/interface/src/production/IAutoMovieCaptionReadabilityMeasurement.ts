import { IAutoMovieCaptionGraphemeSegmentationIdentity } from "./IAutoMovieCaptionGraphemeSegmentationIdentity";

/**
 * Effective readability measurements for one compiled caption cue. Counts use canonical displayed lines and the recorded grapheme runtime; frame counts use the production clock.
 *
 * @evidence contracts/common.md#principled-implementation Grapheme totals and maximum line length count segmenter output over canonical lines, duration is endFrame minus startFrame, gap uses the preceding same-language cue and reading rate is graphemes times fps divided by durationFrames.
 * @evidence contracts/common.md#clear-and-simple-design Measurements retain cue and actual segmentation identity beside raw counts and timing, allowing a profile verdict to remain a separate outcome rather than baking thresholds into these observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts UTF-16 code units do not substitute for grapheme clusters, and a missing preceding cue has null gap rather than a fabricated large gap that would automatically pass a minimum.
 * @evidence contracts/common.md#meaningful-documentation Identifies canonical text and language, exact segmenter, authored line counts, frame duration and same-language gap, and graphemes-per-second units.
 * @author Samchon
 */
export interface IAutoMovieCaptionReadabilityMeasurement {
  /** Exact caption cue id. */
  cue: string;

  /** Canonical cue language. */
  language: string;

  /** Complete identity of the runtime that produced these measurements. */
  segmentation: IAutoMovieCaptionGraphemeSegmentationIdentity;

  /** Grapheme-cluster count across canonical plain-text lines; markup is not stripped. */
  graphemes: number;

  /** Authored line count. */
  lines: number;

  /** Largest displayed grapheme count among authored lines. */
  maxLineGraphemes: number;

  /** Exact cue duration on the production frame clock. */
  durationFrames: number;

  /** Gap from the preceding cue in the same language, or null for the first. */
  gapBeforeFrames: number | null;

  /** Displayed graphemes per second on the production frame clock. */
  graphemesPerSecond: number;
}
