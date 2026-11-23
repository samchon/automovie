import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The world-space axis-aligned box a drawn fluid surface occupies, in metres.
 *
 * Only numerical vertices referenced by emitted triangles contribute. The
 * viewer derives a sphere from this box without scanning dry buffer vertices;
 * the sphere can still enclose space outside the wet geometry, and its bounds
 * are not a separately measured Float32/GPU hull.
 */
export interface IAutoMovieFluidSurfaceBounds {
  /** Minimum corner, in world metres. */
  min: IAutoMovieVector3;

  /** Maximum corner, in world metres. */
  max: IAutoMovieVector3;
}
