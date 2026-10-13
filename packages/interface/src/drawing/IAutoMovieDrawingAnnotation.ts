import { AutoMovieDrawingTargetStatus } from "./AutoMovieDrawingTargetStatus";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One note as the drawing resolved it.
 *
 * Its target is re-resolved against the design on every derivation: a resolved
 * note sits at the projected point of its target feature, and a stale one keeps
 * its id and text with no position.
 *
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
