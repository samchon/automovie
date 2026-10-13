import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The world-space axis-aligned box a drawn fluid surface occupies, in metres.
 *
 * It spans only the vertices referenced by emitted triangles, so dry cells kept
 * in the vertex buffer never widen it. The viewer derives the surface mesh's
 * bounding sphere from this box instead of measuring the vertex buffer.
 *
 * @evidence contracts/common.md#principled-implementation A component-wise minimum and maximum over the positions indexed by the surface triangles, which is the tight axis-aligned box of the water actually drawn.
 * @evidence contracts/common.md#clear-and-simple-design Two corners wrapped in one object that `IAutoMovieFluidSurface.bounds` makes nullable as a whole, so both corners are present or absent together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex is special-cased beyond the stated rule that unreferenced dry vertices are excluded; the viewer uses this box rather than `computeBoundingSphere` for that same reason.
 * @evidence contracts/common.md#meaningful-documentation States the frame, the metre unit, which vertices are measured, and how the viewer uses the box.
 * @author Samchon
 */
export interface IAutoMovieFluidSurfaceBounds {
  /** Minimum corner, in world metres. */
  min: IAutoMovieVector3;

  /** Maximum corner, in world metres. */
  max: IAutoMovieVector3;
}
