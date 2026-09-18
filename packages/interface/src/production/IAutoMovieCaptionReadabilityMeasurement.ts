import { IAutoMovieCaptionGraphemeSegmentationIdentity } from "./IAutoMovieCaptionGraphemeSegmentationIdentity";

/**
 * Effective readability measurements for one compiled caption cue.
 *
 * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Reports grapheme, line, duration, and gap facts even when no profile can judge them.
 * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-measurement Carries actual measurement identity separately from the optional verdict.
 * @author Samchon
 */
export interface IAutoMovieCaptionReadabilityMeasurement {
  /**
   * Exact caption cue id.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Joins measurements to one authored cue.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Keeps per-cue outcomes traceable.
   */
  cue: string;
  /**
   * Canonical cue language.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Selects the production's language profile when present.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Separates language-specific measurement populations.
   */
  language: string;
  /**
   * Complete identity of the runtime that produced these measurements.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Reports the actual segmentation basis even when no profile can judge it.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-measurement Keeps requested and executed segmentation identities distinct.
   */
  segmentation: IAutoMovieCaptionGraphemeSegmentationIdentity;
  /**
   * Displayed grapheme-cluster count after markup removal.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Reports the effective text count used for rate checks.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Measures displayed clusters with the declared segmentation revision.
   */
  graphemes: number;
  /**
   * Authored line count.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Reports the cue's effective line population.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Supplies the line-count comparison input.
   */
  lines: number;
  /**
   * Largest displayed grapheme count among authored lines.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Reports the longest effective line.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Supplies the line-length comparison input.
   */
  maxLineGraphemes: number;
  /**
   * Exact cue duration on the production frame clock.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Measures duration on declared production time.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Supplies the frame-exact duration comparison input.
   */
  durationFrames: number;
  /**
   * Gap from the preceding cue in the same language, or null for the first.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Reports an inter-cue gap only when one exists.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Supplies the same-language gap comparison input.
   */
  gapBeforeFrames: number | null;
  /**
   * Displayed graphemes per second on the production frame clock.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Reports effective reading rate independent of a verdict.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Derives rate from displayed clusters and frame-exact duration.
   */
  graphemesPerSecond: number;
}
