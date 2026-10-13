import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** An axis-aligned world box a schedule row reports. */
export interface IAutoMovieDrawingScheduleBox {
  /** Lower corner in metres. */
  min: IAutoMovieVector3;

  /** Upper corner in metres. */
  max: IAutoMovieVector3;
}
