import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The world-space axis-aligned box a drawn fluid surface occupies, in metres.
 *
 * It spans only the vertices referenced by emitted triangles, so dry cells kept
 * in the vertex buffer never widen it. The viewer derives the surface mesh's
 * bounding sphere from this box instead of measuring the vertex buffer.
 *
 * @author Samchon
 */
export interface IAutoMovieFluidSurfaceBounds {
  /** Minimum corner, in world metres. */
  min: IAutoMovieVector3;

  /** Maximum corner, in world metres. */
  max: IAutoMovieVector3;
}
