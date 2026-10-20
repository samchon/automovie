import { IAutoMovieDrawingFeature } from "./IAutoMovieDrawingFeature";

/**
 * A note pinned to one feature of the design, authored on a view.
 *
 * Every derivation re-resolves `target` and copies `id` and `text` verbatim.
 * `deriveAutoMovieDrawing` refuses a view in which two notes share an id.
 *
 * @evidence contracts/common.md#principled-implementation The note stores a feature address rather than a page anchor, so each derivation resolves its position from current static CPU geometry. Text is copied verbatim and never parsed or recomputed as a measurement; a resolved anchor does not verify the note's statement.
 * @evidence contracts/common.md#clear-and-simple-design Three members, identity, text and target, are all a note needs; style comes from the view's pen and position from the target, so neither is stored here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No page position is stored to fall back on; a repeated id within a view's notes is refused by the derivation rather than resolved twice.
 * @evidence contracts/common.md#meaningful-documentation States that the target is re-resolved on every derivation, that id and text are copied verbatim, and that a repeated id is refused.
 */
export interface IAutoMovieDrawingAnnotationSpec {
  /** Annotation id, unique among the view's notes. */
  id: string;

  /** Note text, drawn as authored. */
  text: string;

  /** Feature the note is pinned to. */
  target: IAutoMovieDrawingFeature;
}
