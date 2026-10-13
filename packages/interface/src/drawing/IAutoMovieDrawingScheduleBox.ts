import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * An axis-aligned world box a schedule row reports.
 *
 * Both corners are world coordinates in metres rounded to six decimals, the
 * same grid the drawing uses, so a schedule digest does not move with float
 * noise.
 *
 * @evidence contracts/common.md#principled-implementation Corners are per-axis minima and maxima of the points that bound a space (a shell's vertices or the closed planes of axis-aligned cells for a declared box, staged geometry for a content box), then rounded to six decimals so the schedule digest is stable.
 * @evidence contracts/common.md#clear-and-simple-design Two world vectors and nothing else, shared by the `declared` and `content` fields of a space place so the two extents compare field for field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A box is reported only where the input fixes it exactly: `declaredSpaceBox` answers `null` for a chamfered or open-sided cell instead of approximating its bounds.
 * @evidence contracts/common.md#meaningful-documentation Gives the world frame, the metre unit and the six-decimal rounding the corners share with the drawing grid.
 * @author Samchon
 */
export interface IAutoMovieDrawingScheduleBox {
  /** Lower corner in metres. */
  min: IAutoMovieVector3;

  /** Upper corner in metres. */
  max: IAutoMovieVector3;
}
