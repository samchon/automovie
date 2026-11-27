/**
 * One beat's caption and the slug of its enclosing scene, as the caption join
 * reads them from the screenplay tree.
 *
 * `AutoMovieRenderCaption.beatCaptions` builds one record per beat node, keyed by beat id, and
 * `AutoMovieRenderCaption.planSidecar` copies both fields onto every sidecar span whose live
 * shot belongs to that beat.
 */
export interface IAutoMovieBeatCaption {
  /** The beat's authored shot caption, or null when the beat authored none. */
  caption: string | null;

  /**
   * Slug of the nearest enclosing scene node, or null when no scene encloses
   * the beat.
   */
  slug: string | null;
}
