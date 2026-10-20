import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The world-space axis-aligned box a drawn fluid surface occupies, in metres.
 *
 * Only numerical vertices referenced by emitted triangles contribute. The viewer derives a sphere from this box without scanning dry buffer vertices; the sphere can still enclose space outside the wet geometry, and its bounds are not a separately measured Float32/GPU hull.
 *
 * @evidence contracts/common.md#principled-implementation fluidSurfaceGeometry takes per-axis minima/maxima over triangle-referenced numerical positions. For finite positions this is their exact axis-aligned hull; the producer has no separate finite-result check for extreme derived positions.
 * @evidence contracts/common.md#clear-and-simple-design Two corners are the whole box; it exists only inside the nullable `IAutoMovieFluidSurface.bounds`, so an empty surface has no box instead of an infinite or inverted one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreferenced dry cells do not enlarge this box. A sphere derived from the box may include drained or otherwise empty surrounding space; neither this record nor that sphere proves wet coverage or pixel equality.
 * @evidence contracts/common.md#meaningful-documentation States world metre units, indexed numerical membership, finite-position premise and the difference between this hull, a derived enclosing sphere and GPU projection; members identify each corner.
 */
export interface IAutoMovieFluidSurfaceBounds {
  /** Minimum corner, in world metres. */
  min: IAutoMovieVector3;

  /** Maximum corner, in world metres. */
  max: IAutoMovieVector3;
}
