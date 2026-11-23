import type { AutoMovieDrawingTargetStatus } from "./AutoMovieDrawingTargetStatus";
import type { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One note as the drawing resolved it.
 *
 * Its target is re-resolved against the design on every derivation: a resolved
 * note sits at the projected point of its target feature, and a stale one keeps
 * its id and text with no position. A drawing with any resolved note also
 * declares the `note-text-extent` gap, because the glyphs are never measured.
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
