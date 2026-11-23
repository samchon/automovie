import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import type { IAutoMovieFluidSurfaceBounds } from "./IAutoMovieFluidSurfaceBounds";

/**
 * The derived free-surface geometry of one fluid state.
 *
 * FluidSurfaceGeometry derives positions, normals, UVs, flow and drawn bounds
 * from the supplied domain/state and refuses a mismatched domain id. The viewer
 * copies numeric attributes into Float32 buffers rather than deriving another
 * surface; upload therefore preserves the authored projection path, not
 * binary64 values or pixel equality.
 */
export interface IAutoMovieFluidSurface {
  /** Id of the domain the surface was derived from. */
  domain: string;

  /** Absolute step the surface was derived at. */
  step: number;

  /**
   * Triangulated free surface in world metres. One vertex per cell, including
   * dry cells, follows row-major order; only quads whose four corners are wet
   * and nonsolid produce triangles, so a dry basin emits no drawn quad.
   *
   * Normals use central differences, one-sided at edges, with no slope
   * contribution from a single-cell axis. UVs span [0, 1] and stay zero on a
   * single-cell axis, triangles wind counter-clockwise from above and skin is
   * null; finite-result admission for extreme derived arithmetic remains
   * outside this derivation.
   */
  mesh: IAutoMovieMesh;

  /**
   * World extent of the numerical vertices referenced by drawn triangles, or
   * null when no quad is emitted, including dry or too-small lattices. It is
   * not a separately measured Float32/GPU bound.
   *
   * One nullable box keeps minimum and maximum absent together.
   */
  bounds: IAutoMovieFluidSurfaceBounds | null;

  /**
   * Per-vertex horizontal velocity [x, z, ...] in m/s, averaging the two faces
   * around each cell on each axis. The viewer copies it into the Float32 aFlow
   * attribute for a supplied shader; no maintained stock material uses it to
   * scroll ripples.
   */
  flow: number[];
}
