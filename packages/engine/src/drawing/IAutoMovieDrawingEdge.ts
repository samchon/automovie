import { IAutoMovieVector3 } from "@automovie/interface";

/** A straight world-space segment awaiting projection. */
export interface IAutoMovieDrawingEdge {
  /** Segment start. */
  from: IAutoMovieVector3;
  /** Segment end. */
  to: IAutoMovieVector3;
}
