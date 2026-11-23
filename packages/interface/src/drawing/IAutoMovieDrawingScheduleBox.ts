import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * An axis-aligned world box a space schedule row reports.
 *
 * Both corners are world coordinates in metres rounded to six decimals.
 * Rounding can merge nearby bounds or cross a grid boundary after a small input
 * change; it does not make the schedule digest generally insensitive to
 * floating-point noise.
 */
export interface IAutoMovieDrawingScheduleBox {
  /** Lower corner in world metres. */
  min: IAutoMovieVector3;

  /** Upper corner in world metres. */
  max: IAutoMovieVector3;
}
