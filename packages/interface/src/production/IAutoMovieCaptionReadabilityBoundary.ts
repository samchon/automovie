/**
 * One production-owned numeric caption boundary.
 *
 * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Makes equality behavior part of the declared threshold.
 * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Carries each numeric value with inclusive or exclusive semantics.
 * @author Samchon
 */
export interface IAutoMovieCaptionReadabilityBoundary {
  /**
   * Finite non-negative threshold value.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Carries the production's numeric threshold.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Supplies the value used by deterministic comparison.
   */
  value: number;
  /**
   * Whether equality satisfies this boundary.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Declares inclusive versus exclusive equality semantics.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Prevents validators from assuming one boundary convention.
   */
  inclusive: boolean;
}
