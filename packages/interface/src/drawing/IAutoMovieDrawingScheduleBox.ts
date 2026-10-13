import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * An axis-aligned world box a space schedule row reports.
 *
 * Both corners are world coordinates in metres rounded to six decimals, the
 * grid drawings use, so a schedule digest does not move with float noise.
 * `min` is at or below `max` on every axis.
 *
 * @evidence contracts/common.md#principled-implementation `autoMovieDrawingSpaceBox` takes per-axis minima and maxima of a shell's vertices or of the union of axis-aligned cell bounds, the schedule copies `builtEnvironmentSpaceContentBounds` for the content box, and both pass through `roundAutoMovieDrawingVector` onto the six-decimal grid.
 * @evidence contracts/common.md#clear-and-simple-design Two corner vectors are the smallest form of an axis-aligned box and match the shape of the content bounds it is copied from, so the declared and content boxes of a space place read the same way.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The box is only ever a copy of a stated or measured extent; a cell that is not axis-aligned and closed yields no box at all rather than an approximated one.
 * @evidence contracts/common.md#meaningful-documentation States the world frame, the metre unit, the six-decimal rounding and its reason, and the corner ordering.
 * @author Samchon
 */
export interface IAutoMovieDrawingScheduleBox {
  /** Lower corner in world metres. */
  min: IAutoMovieVector3;

  /** Upper corner in world metres. */
  max: IAutoMovieVector3;
}
