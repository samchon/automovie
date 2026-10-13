import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * An axis-aligned world box a schedule row reports.
 *
 * Both corners are world coordinates in metres rounded to six decimals, the
 * same grid the drawing uses, so a schedule digest does not move with float
 * noise.
 *
 * @author Samchon
 */
export interface IAutoMovieDrawingScheduleBox {
  /** Lower corner in metres. */
  min: IAutoMovieVector3;

  /** Upper corner in metres. */
  max: IAutoMovieVector3;
}
