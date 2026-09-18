/**
 * One canonical cue parsed from final WebVTT bytes.
 *
 * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-cue-text-language Retains delivered cue identity, text, and exact millisecond boundaries for comparison with the current caption plan.
 * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-cues Supplies the canonical delivered cue facts consumed by final caption verification.
 */
export interface IAutoMovieProductionWebVttCue {
  /**
   * Delivered cue identifier, if present.
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-cue-text-language Preserves cue identity for current-plan comparison.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-cues Supplies the delivered cue id.
   */
  id: string | null;
  /**
   * Complete delivered cue payload.
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-cue-text-language Preserves caption text and markup identity.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-cues Supplies the delivered cue text.
   */
  text: string;
  /**
   * Exact parsed cue-start millisecond.
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-cue-freshness Preserves the delivered start boundary.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-cues Supplies the delivered cue start.
   */
  startMilliseconds: number;
  /**
   * Exact parsed exclusive cue-end millisecond.
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-cue-freshness Preserves the delivered end boundary.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-cues Supplies the delivered cue end.
   */
  endMilliseconds: number;
}
