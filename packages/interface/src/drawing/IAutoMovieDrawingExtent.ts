import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/** Page bounding box of a drawing's content. */
export interface IAutoMovieDrawingExtent {
  /** Lowest page coordinate on each axis. */
  min: IAutoMovieDrawingPoint;

  /** Highest page coordinate on each axis. */
  max: IAutoMovieDrawingPoint;
}
