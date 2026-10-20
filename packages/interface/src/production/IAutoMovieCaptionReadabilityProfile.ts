import { IAutoMovieCaptionGraphemeSegmentationIdentity } from "./IAutoMovieCaptionGraphemeSegmentationIdentity";
import { IAutoMovieCaptionReadabilityBoundary } from "./IAutoMovieCaptionReadabilityBoundary";

/**
 * Production-owned caption readability thresholds for one language.
 *
 * AutoMovie ships no threshold preset. The user or authoring agent chooses the language, segmentation revision, and every boundary; omission means metrics may be reported but no readability verdict may be inferred.
 *
 * @evidence contracts/common.md#principled-implementation A language profile carries exact grapheme segmentation and five declared boundaries; render matches language ASCII case-insensitively and applies boundary inclusivity, relying on callers for finite nonnegative values because this type performs no numeric admission.
 * @evidence contracts/common.md#clear-and-simple-design One profile owns all readability choices for one language, separating user-selected thresholds from actual measurement runtime and from byte-stable compiled caption timing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Render infers no threshold preset or registry preferred language value and returns no verdict without a matching profile; this DTO does not enforce unique profile languages, so callers must prevent duplicate identities that render's map would overwrite.
 * @evidence contracts/common.md#meaningful-documentation Gives production ownership, profile version, retained language spelling and identity limits, segmentation revision and the units and directions of all five explicit thresholds.
 */
export interface IAutoMovieCaptionReadabilityProfile {
  /** Stable profile identity within the production. */
  id: string;

  /** Production-controlled schema revision. */
  version: number;

  /**
   * RFC 5646 well-formed language tag whose cues this profile evaluates.
   *
   * Authored spelling is retained while identity comparison is ASCII case-insensitive. Registry membership and Preferred-Value replacement are outside this field's validation contract.
   */
  language: string;

  /** Production-selected versioned grapheme segmentation rule. */
  segmentation: IAutoMovieCaptionGraphemeSegmentationIdentity;

  /** Maximum displayed graphemes per second and its boundary semantics. */
  maxGraphemesPerSecond: IAutoMovieCaptionReadabilityBoundary;

  /** Maximum authored lines in one cue and its boundary semantics. */
  maxLinesPerCue: IAutoMovieCaptionReadabilityBoundary;

  /** Maximum displayed graphemes in one line and its boundary semantics. */
  maxGraphemesPerLine: IAutoMovieCaptionReadabilityBoundary;

  /** Minimum cue duration in frames and its boundary semantics. */
  minDurationFrames: IAutoMovieCaptionReadabilityBoundary;

  /** Minimum inter-cue gap in frames and its boundary semantics. */
  minGapFrames: IAutoMovieCaptionReadabilityBoundary;
}
