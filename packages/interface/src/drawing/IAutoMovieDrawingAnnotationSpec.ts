import { IAutoMovieDrawingFeature } from "./IAutoMovieDrawingFeature";

/**
 * A note pinned to one feature of the design, authored on a view.
 *
 * Every derivation re-resolves `target` and copies `id` and `text` verbatim.
 * Nothing validates that ids are unique within a view.
 *
 * @evidence contracts/common.md#principled-implementation Stores a feature reference instead of a position, so the note's place is derived from the design each time the drawing is taken.
 * @evidence contracts/common.md#clear-and-simple-design Three fields, identity, text and target; pen and text height come from the view style rather than from each note.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Text is never parsed or rewritten, and the spec carries no cached coordinates that could quietly go stale.
 * @evidence contracts/common.md#meaningful-documentation States that the target re-resolves on every derivation, that id and text pass through verbatim, and that id uniqueness is not checked.
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
