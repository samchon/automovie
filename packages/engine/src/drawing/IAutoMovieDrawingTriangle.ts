import { IAutoMovieVector3 } from "@automovie/interface";

/** One world-space triangle of some element's geometry. */
export interface IAutoMovieDrawingTriangle {
  /** First corner. */
  a: IAutoMovieVector3;
  /** Second corner. */
  b: IAutoMovieVector3;
  /** Third corner. */
  c: IAutoMovieVector3;
}
