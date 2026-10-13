import { IAutoMovieCaptionGraphemeSegmentationIdentity } from "./IAutoMovieCaptionGraphemeSegmentationIdentity";

/**
 * Effective readability measurements for one compiled caption cue.
 *
 * @author Samchon
 */
export interface IAutoMovieCaptionReadabilityMeasurement {
  /** Exact caption cue id. */
  cue: string;

  /** Canonical cue language. */
  language: string;

  /** Complete identity of the runtime that produced these measurements. */
  segmentation: IAutoMovieCaptionGraphemeSegmentationIdentity;

  /** Displayed grapheme-cluster count after markup removal. */
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
