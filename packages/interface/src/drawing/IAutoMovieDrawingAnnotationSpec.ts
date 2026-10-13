import { IAutoMovieDrawingFeature } from "./IAutoMovieDrawingFeature";

/**
 * A note pinned to one feature of the design, authored on a view.
 *
 * Every derivation re-resolves `target` and copies `id` and `text` verbatim.
 * Nothing validates that ids are unique within a view.
 *
 * @evidence contracts/common.md#principled-implementation The note stores where it is pinned rather than where it was drawn, so each derivation recomputes its position from the current design through `resolveAutoMovieDrawingFeature`.
 * @evidence contracts/common.md#clear-and-simple-design Three members, identity, text and target, are all a note needs; style comes from the view's pen and position from the target, so neither is stored here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No page position is stored to fall back on; id uniqueness within a view is unenforced, a gap left to the author and stated on the member.
 * @evidence contracts/common.md#meaningful-documentation States that the target is re-resolved on every derivation, that id and text are copied verbatim, and that id uniqueness is not checked.
 * @author Samchon
 */
export interface IAutoMovieDrawingAnnotationSpec {
  /** Annotation id within the view; nothing checks that it is unique. */
  id: string;

  /** Note text, drawn as authored. */
  text: string;

  /** Feature the note is pinned to. */
  target: IAutoMovieDrawingFeature;
}
