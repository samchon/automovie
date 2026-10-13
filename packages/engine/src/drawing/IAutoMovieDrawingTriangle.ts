import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One triangle of some element's geometry.
 *
 * Corners are metres in world space, except the design index's per-part
 * triangles, which stay in the model frame until an element's world matrix
 * transforms them. The winding `a -> b -> c` fixes the face normal as
 * `(b - a) x (c - a)` by the right-hand rule, and silhouette extraction reads
 * that normal to decide which side faces the viewer, so producers keep the
 * source mesh's winding. Clipping walks the corners in order and re-fans
 * them, which preserves it; cut extraction ignores it. Feature resolution
 * indexes faces in the order producers emit them.
 *
 * @evidence contracts/common.md#principled-implementation Three ordered corners are the standard oriented-triangle record, and the right-hand cross product of its edges is the usual face normal, so facing needs no stored normal that could disagree with the corners.
 * @evidence contracts/common.md#clear-and-simple-design One triangle record shared by element and shell triangulation, clipping, transformation, silhouette and cut extraction, and feature resolution, so the whole drawing pipeline passes geometry in one shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no element, part or role field a stage could special-case; orientation comes from the corners alone.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the units and the one model-frame producer, the winding and normal convention, which stages depend on winding and which preserve or ignore it, and that face indices follow emission order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record type with no runtime code; producers emit one per mesh or shell triangle.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record type with no runtime code; the design index tessellates each model part once and every placement of it reuses those model-frame triangles.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record of three points owned by the triangle list that holds it; it retains nothing itself.
 * @author Samchon
 */
export interface IAutoMovieDrawingTriangle {
  /** First corner, in metres. */
  a: IAutoMovieVector3;

  /** Second corner, in metres. */
  b: IAutoMovieVector3;

  /** Third corner, in metres. */
  c: IAutoMovieVector3;
}
