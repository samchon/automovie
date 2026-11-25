import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A straight world-space segment awaiting projection.
 *
 * Endpoints are world metres in the design's own frame, before the drawing
 * frame projects them onto the sheet. Silhouette and cut extraction emit these,
 * and drafting projects and rounds both endpoints into one line; the direction
 * from `from` to `to` carries no meaning. Silhouette extraction already drops
 * an edge whose endpoints round to the same world point, a cut segment can be
 * arbitrarily short, and drafting drops any edge whose two projected endpoints
 * round to the same sheet point.
 */
export interface IAutoMovieDrawingEdge {
  /** One endpoint, in world metres. */
  from: IAutoMovieVector3;

  /** The other endpoint, in world metres. */
  to: IAutoMovieVector3;
}
