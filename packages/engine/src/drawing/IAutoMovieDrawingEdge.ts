import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A straight world-space segment awaiting projection.
 *
 * Endpoints are world metres in the design's own frame, before the drawing
 * frame projects them onto the sheet. Silhouette and cut extraction emit
 * these, and drafting projects and rounds both endpoints into one line; the
 * direction from `from` to `to` carries no meaning. Silhouette extraction
 * already drops an edge whose endpoints round to the same world point, a cut
 * segment can be arbitrarily short, and drafting drops any edge whose two
 * projected endpoints round to the same sheet point.
 *
 * @evidence contracts/development/design.md#principled-representation An unordered pair of world points is the minimal record of a straight line segment before projection, which keeps extraction independent of any view's sheet coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One edge record shared by silhouette extraction, cut extraction and drafting, so the two extractors feed one projection path instead of each emitting sheet lines.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no role, element or view field, so no extractor can special-case one through the edge itself; degenerate edges are dropped by stated rules at extraction and drafting.
 * @evidence contracts/development/common.md#meaningful-documentation The documentation states the units and frame, the producers and consumer, that direction is meaningless, and where degenerate edges are dropped.
 */
export interface IAutoMovieDrawingEdge {
  /** One endpoint, in world metres. */
  from: IAutoMovieVector3;

  /** The other endpoint, in world metres. */
  to: IAutoMovieVector3;
}
