/**
 * One beat's caption and the slug of its enclosing scene, as the caption join
 * reads them from the screenplay tree.
 *
 * @author Samchon
 */
export interface IAutoMovieBeatCaption {
  /** The beat's authored caption, or null when it has none. */
  caption: string | null;

  /** Slug of the nearest enclosing scene, or null above every scene. */
  slug: string | null;
}
