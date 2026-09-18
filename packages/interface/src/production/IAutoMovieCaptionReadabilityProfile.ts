import { IAutoMovieCaptionGraphemeSegmentationIdentity } from "./IAutoMovieCaptionGraphemeSegmentationIdentity";
import { IAutoMovieCaptionReadabilityBoundary } from "./IAutoMovieCaptionReadabilityBoundary";

/**
 * Production-owned caption readability thresholds for one language.
 *
 * AutoMovie ships no threshold preset. The user or authoring agent chooses the
 * language, segmentation revision, and every boundary; omission means metrics
 * may be reported but no readability verdict may be inferred.
 *
 * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Makes readability thresholds a production-owned, opt-in decision.
 * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Carries the versioned segmentation and numeric boundaries used by validation.
 * @author Samchon
 */
export interface IAutoMovieCaptionReadabilityProfile {
  /**
   * Stable profile identity within the production.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Makes the selected threshold set addressable.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Joins each verdict to the exact production profile.
   */
  id: string;

  /**
   * Production-controlled schema revision.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Versions the declared threshold semantics.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Prevents results from silently crossing profile revisions.
   */
  version: number;

  /**
   * RFC 5646 well-formed language tag whose cues this profile evaluates.
   *
   * Authored spelling is retained while identity comparison is ASCII
   * case-insensitive. Registry membership and Preferred-Value replacement are
   * outside this field's validation contract.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Keeps thresholds language-specific and production-owned.
   * @evidence requirements/delivery-and-accessibility/localization-and-language-versions.md#delivery-language-selection Preserves authored display spelling while language lookup uses one case-insensitive identity.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Selects which cue population the profile evaluates.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-localization Applies the shared RFC 5646 syntax and comparison boundary.
   */
  language: string;

  /**
   * Production-selected versioned grapheme segmentation rule.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Requires segmentation identity alongside numeric thresholds.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Makes grapheme measurement reproducible without hardcoding one Unicode family.
   */
  segmentation: IAutoMovieCaptionGraphemeSegmentationIdentity;

  /**
   * Maximum displayed graphemes per second and its boundary semantics.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Declares rate and equality behavior together.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Supplies the explicit rate comparison boundary.
   */
  maxGraphemesPerSecond: IAutoMovieCaptionReadabilityBoundary;

  /**
   * Maximum authored lines in one cue and its boundary semantics.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Declares line-count and equality behavior together.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Supplies the explicit line-count comparison boundary.
   */
  maxLinesPerCue: IAutoMovieCaptionReadabilityBoundary;

  /**
   * Maximum displayed graphemes in one line and its boundary semantics.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Declares line-length and equality behavior together.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Supplies the explicit line-length comparison boundary.
   */
  maxGraphemesPerLine: IAutoMovieCaptionReadabilityBoundary;

  /**
   * Minimum cue duration in frames and its boundary semantics.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Declares duration and equality behavior together.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Supplies the explicit duration comparison boundary.
   */
  minDurationFrames: IAutoMovieCaptionReadabilityBoundary;

  /**
   * Minimum inter-cue gap in frames and its boundary semantics.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Declares gap and equality behavior together.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Supplies the explicit gap comparison boundary.
   */
  minGapFrames: IAutoMovieCaptionReadabilityBoundary;
}
