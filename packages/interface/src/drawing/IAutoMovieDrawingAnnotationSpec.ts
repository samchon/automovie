import { IAutoMovieDrawingFeature } from "./IAutoMovieDrawingFeature";

/**
 * A note pinned to one feature of the design, authored on a view.
 *
 * Every derivation re-resolves `target` and copies `id` and `text` verbatim.
 * Nothing validates that ids are unique within a view.
 *
 * @author Samchon
 */
export interface IAutoMovieDrawingAnnotationSpec {
  /** Annotation identity within the view; uniqueness is the author's duty. */
  id: string;

  /** Note text, drawn as authored. */
  text: string;

  /** Feature the note is pinned to. */
  target: IAutoMovieDrawingFeature;
}
