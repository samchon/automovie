import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One triangle of some element's geometry.
 *
 * Corners are metres in world space, except the design index's per-part
 * triangles, which stay in the model frame until an element's world matrix
 * transforms them. The winding `a -> b -> c` fixes the face normal as `(b - a)
 * x (c - a)` by the right-hand rule, and silhouette extraction reads that
 * normal to decide which side faces the viewer, so producers keep the source
 * mesh's winding. Clipping walks the corners in order and re-fans them, which
 * preserves it; cut extraction ignores it. Feature resolution indexes faces in
 * the order producers emit them.
 */
export interface IAutoMovieDrawingTriangle {
  /** First corner, in metres. */
  a: IAutoMovieVector3;

  /** Second corner, in metres. */
  b: IAutoMovieVector3;

  /** Third corner, in metres. */
  c: IAutoMovieVector3;
}
