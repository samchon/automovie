import { AutoMovieDrawingTargetStatus } from "./AutoMovieDrawingTargetStatus";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/** One dimension as the drawing resolved it. */
export interface IAutoMovieDrawingDimension {
  /** Dimension identity, as authored. */
  id: string;

  /** What the measurement means. */
  measure: "page" | "world";

  /** Whether both ends resolved. */
  status: AutoMovieDrawingTargetStatus;

  /** Page start point, or `null` when stale. */
  from: IAutoMovieDrawingPoint | null;

  /** Page end point, or `null` when stale. */
  to: IAutoMovieDrawingPoint | null;

  /** Measured distance in metres, or `null` when stale. */
  value: number | null;

  /** Exactly why the target no longer resolves, or `null` when resolved. */
  reason: string | null;
}
