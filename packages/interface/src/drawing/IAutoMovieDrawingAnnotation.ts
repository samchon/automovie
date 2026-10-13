import { AutoMovieDrawingTargetStatus } from "./AutoMovieDrawingTargetStatus";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One note as the drawing resolved it.
 *
 * Its target is re-resolved against the design on every derivation: a resolved
 * note sits at the projected point of its target feature, and a stale one keeps
 * its id and text with no position.
 *
 * @evidence contracts/common.md#principled-implementation Projects the resolved feature point through the drawing frame and rounds it to six decimals, so the anchor is recomputed from the current design on each derivation.
 * @evidence contracts/common.md#clear-and-simple-design Mirrors the authored spec with the resolution outcome added, so a consumer matches notes to the view by `id` without consulting the spec.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A stale note keeps its slot with a reason instead of being dropped, and the unmeasured glyph extent is declared as the `note-text-extent` gap rather than estimated.
 * @evidence contracts/common.md#meaningful-documentation States the unit and rounding of `at`, that it is an anchor rather than a text box, and the null and reason semantics for each status.
 * @author Samchon
 */
export interface IAutoMovieDrawingAnnotation {
  /** Annotation identity, as authored. */
  id: string;

  /** Note text, as authored. */
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
