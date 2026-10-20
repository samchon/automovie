import { AutoMovieDrawingTargetStatus } from "./AutoMovieDrawingTargetStatus";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One note as the drawing resolved it.
 *
 * Its target is re-resolved against the design on every derivation: a resolved
 * note sits at the projected point of its target feature, and a stale one keeps
 * its id and text with no position. A drawing with any resolved note also
 * declares the `note-text-extent` gap, because the glyphs are never measured.
 *
 * @evidence contracts/common.md#principled-implementation `deriveAutoMovieDrawing` resolves the spec's target with `resolveAutoMovieDrawingFeature`, projects a resolved world point onto the frame and rounds it to six decimals, and copies a stale resolution's reason verbatim.
 * @evidence contracts/common.md#clear-and-simple-design The resolved note mirrors its spec's id and text and adds only the outcome, so a reader reconciles sheet and view by id without consulting the view.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A stale note keeps its text but loses its position instead of staying at the last known point, and the text extent is declared as a gap rather than estimated.
 * @evidence contracts/common.md#meaningful-documentation States when each member is null, the page units of the anchor, that the text extent is not measured, and where the reason comes from.
 */
export interface IAutoMovieDrawingAnnotation {
  /** Annotation id, copied from the view. */
  id: string;

  /** Note text, copied from the view. */
  text: string;

  /** Whether the target resolved. */
  status: AutoMovieDrawingTargetStatus;

  /**
   * Page position of the target feature in metres, or `null` when stale. It is
   * the anchor the text is set from; the text's own extent is not measured.
   */
  at: IAutoMovieDrawingPoint | null;

  /** Exactly why the target no longer resolves, or `null` when resolved. */
  reason: string | null;
}
