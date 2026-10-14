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
 * @evidence contracts/common.md#principled-implementation An unordered pair of world points is the minimal record of a straight line segment before projection, which keeps extraction independent of any view's sheet coordinates.
 * @evidence contracts/common.md#clear-and-simple-design One edge record shared by silhouette extraction, cut extraction and drafting, so the two extractors feed one projection path instead of each emitting sheet lines.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no role, element or view field, so no extractor can special-case one through the edge itself; degenerate edges are dropped by stated rules at extraction and drafting.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the units and frame, the producers and consumer, that direction is meaningless, and where degenerate edges are dropped.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record type with no runtime code; extraction emits at most one edge per welded mesh edge or cut triangle.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record type with no runtime code; each edge is produced once per drawable and drafted once.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record of two points owned by the edge list that holds it; drafting retains only the projected line.
 * @author Samchon
 */
export interface IAutoMovieDrawingEdge {
  /** One endpoint, in world metres. */
  from: IAutoMovieVector3;

  /** The other endpoint, in world metres. */
  to: IAutoMovieVector3;
}
