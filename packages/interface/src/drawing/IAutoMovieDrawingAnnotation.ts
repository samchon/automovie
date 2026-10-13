import { AutoMovieDrawingTargetStatus } from "./AutoMovieDrawingTargetStatus";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/** One note as the drawing resolved it. */
export interface IAutoMovieDrawingAnnotation {
  /** Annotation identity, as authored. */
  id: string;

  /** Note text, as authored. */
  text: string;

  /** Whether the target resolved. */
  status: AutoMovieDrawingTargetStatus;

  /** Page position of the target, or `null` when stale. */
  at: IAutoMovieDrawingPoint | null;

  /** Exactly why the target no longer resolves, or `null` when resolved. */
  reason: string | null;
}
