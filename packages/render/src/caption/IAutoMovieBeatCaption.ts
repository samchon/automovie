/**
 * One beat's caption and the slug of its enclosing scene, as the caption join
 * reads them from the screenplay tree.
 *
 * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-cue-freshness Carries the authored caption and scene slug keyed to one beat identity.
 * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-cues Supplies the authored text a frame-aligned cue sidecar is built from.
 * @author Samchon
 */
export interface IAutoMovieBeatCaption {
  /**
   * The beat's authored caption, or null when it has none.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-cue-freshness Passes the authored caption text through without replacement.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-cues Supplies a span's cue text or null for an uncaptioned span.
   */
  caption: string | null;

  /**
   * Slug of the nearest enclosing scene, or null above every scene.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-cue-freshness Labels the cue with the scene it belongs to.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-cues Carries the scene slug the sidecar may show beside the cue.
   */
  slug: string | null;
}
