import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A straight world-space segment awaiting projection.
 *
 * Endpoints are world metres in the design's own frame, before the drawing
 * frame projects them onto the sheet. Silhouette and cut extraction emit
 * these; the direction from `from` to `to` carries no meaning. Silhouette
 * extraction skips an edge whose endpoints round to the same output point,
 * while a cut segment can be arbitrarily short.
 *
 * @author Samchon
 */
export interface IAutoMovieDrawingEdge {
  /** Segment start, in world metres. */
  from: IAutoMovieVector3;

  /** Segment end, in world metres. */
  to: IAutoMovieVector3;
}
