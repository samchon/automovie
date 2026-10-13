import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One world-space triangle of some element's geometry.
 *
 * Corners are world metres. The winding `a -> b -> c` fixes the face normal as
 * `(b - a) x (c - a)` by the right-hand rule, and silhouette extraction reads
 * that normal to decide which side faces the viewer, so producers keep the
 * source mesh's winding. Clipping walks the corners in order and re-fans
 * them, which preserves it; cut extraction ignores it.
 *
 * @author Samchon
 */
export interface IAutoMovieDrawingTriangle {
  /** First corner, in world metres. */
  a: IAutoMovieVector3;

  /** Second corner, in world metres. */
  b: IAutoMovieVector3;

  /** Third corner, in world metres. */
  c: IAutoMovieVector3;
}
