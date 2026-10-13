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
 * @evidence contracts/common.md#principled-implementation Two world points are the whole representation of a straight drawn line, so projection, clipping and rounding happen once in the drawing derivation instead of being stored per edge.
 * @evidence contracts/common.md#clear-and-simple-design Shared by `autoMovieDrawingSilhouetteEdges`, `autoMovieDrawingCutEdges` and `deriveAutoMovieDrawing`, it holds no style, layer or element id; those belong to the drawn primitive the derivation builds from it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no orientation flag or tolerance of its own; welding of nearly equal endpoints is done by silhouette extraction on the rounded output grid, not encoded here.
 * @evidence contracts/common.md#meaningful-documentation States the frame and unit, that projection has not happened yet, who produces the edges, that direction is meaningless, and which extractor can emit a very short segment.
 * @evidenceExclude contracts/performance.md#cost-and-resources A two-field record that computes nothing; extraction and projection costs belong to the functions that create and consume it.
 * @author Samchon
 */
export interface IAutoMovieDrawingEdge {
  /** Segment start, in world metres. */
  from: IAutoMovieVector3;

  /** Segment end, in world metres. */
  to: IAutoMovieVector3;
}
