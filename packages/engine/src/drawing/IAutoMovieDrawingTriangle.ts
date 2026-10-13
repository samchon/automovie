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
 * @evidence contracts/common.md#principled-implementation Three explicit corners rather than indices into a shared vertex buffer, so a triangle can be transformed, clipped and cut independently and its winding travels with it.
 * @evidence contracts/common.md#clear-and-simple-design One soup type shared by part tessellation, boundary shells, transformation, clipping, silhouette and cut extraction and feature resolution, with no element id or material, which the drawing derivation tracks beside the list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stores no precomputed normal or tolerance; each consumer derives facing from the winding and applies its own epsilon, so nothing here can disagree with the corners.
 * @evidence contracts/common.md#meaningful-documentation States the frame and unit, the winding convention and the normal it defines, which consumer depends on it, that clipping preserves it, and that cut extraction ignores it.
 * @evidenceExclude contracts/performance.md#cost-and-resources A three-corner record that computes and retains nothing; the cost of building and walking triangle soups belongs to the drawing functions that produce and consume them.
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
