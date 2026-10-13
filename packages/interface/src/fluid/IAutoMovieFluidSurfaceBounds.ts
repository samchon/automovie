import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The world-space axis-aligned box a drawn fluid surface occupies, in metres.
 *
 * It spans only the vertices referenced by emitted triangles, so dry cells kept
 * in the vertex buffer never widen it. The viewer derives the surface mesh's
 * bounding sphere from this box instead of measuring the vertex buffer.
 *
 * @evidence contracts/common.md#principled-implementation `fluidSurfaceGeometry` takes the per-axis minimum and maximum over the positions of every index in the emitted triangle list, which is the exact axis-aligned hull of the drawn surface.
 * @evidence contracts/common.md#clear-and-simple-design Two corners are the whole box; it exists only inside the nullable `IAutoMovieFluidSurface.bounds`, so an empty surface has no box instead of an infinite or inverted one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The box is measured from emitted geometry rather than the full lattice, so the viewer's culling sphere never includes a drained rim that no depth value supports.
 * @evidence contracts/common.md#meaningful-documentation States the frame and unit, which vertices it covers and why dry ones are excluded, and how the viewer uses it; members name each corner.
 * @author Samchon
 */
export interface IAutoMovieFluidSurfaceBounds {
  /** Minimum corner, in world metres. */
  min: IAutoMovieVector3;

  /** Maximum corner, in world metres. */
  max: IAutoMovieVector3;
}
