import { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import { IAutoMovieFluidSurfaceBounds } from "./IAutoMovieFluidSurfaceBounds";

/**
 * The derived free-surface geometry of one fluid state.
 *
 * fluidSurfaceGeometry derives positions, normals, UVs, flow and drawn bounds from the supplied domain/state and refuses a mismatched domain id. The viewer copies numeric attributes into Float32 buffers rather than deriving another surface; upload therefore preserves the authored projection path, not binary64 values or pixel equality.
 *
 * @evidence contracts/common.md#principled-implementation fluidSurfaceGeometry places one vertex per cell at origin.y + bed + depth, derives finite-difference normals and triangulates only quads with four wet, nonsolid cells. The supplied state must match the admitted domain's array layout; a matching id alone does not validate those arrays, and extreme derived sums, slopes or normal arithmetic have no separate finite-result gate.
 * @evidence contracts/common.md#clear-and-simple-design The surface reuses the shared `IAutoMovieMesh` shape and adds only the domain, the step, the drawn extent and the per-vertex flow, which are the facts a viewer needs beyond plain geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Dry vertices retain cell-index correspondence, while bounds reads only emitted triangle indices. Float32 upload is a numerical projection rather than exact-value or visual proof, and the stock viewer material does not consume flow for ripples.
 * @evidence contracts/common.md#meaningful-documentation Identifies the derivation and mismatch refusal, admitted-array and arithmetic limits, Float32 viewer projection, indexed drawn bounds, vertex/triangle/normal/UV conventions and unconsumed flow metadata.
 */
export interface IAutoMovieFluidSurface {
  /** Id of the domain the surface was derived from. */
  domain: string;

  /** Absolute step the surface was derived at. */
  step: number;

  /**
   * Triangulated free surface in world metres. One vertex per cell, including dry cells, follows row-major order; only quads whose four corners are wet and nonsolid produce triangles, so a dry basin emits no drawn quad.
   *
   * Normals use central differences, one-sided at edges, with no slope contribution from a single-cell axis. UVs span [0, 1] and stay zero on a single-cell axis, triangles wind counter-clockwise from above and skin is null; finite-result admission for extreme derived arithmetic remains outside this derivation.
   */
  mesh: IAutoMovieMesh;

  /**
   * World extent of the numerical vertices referenced by drawn triangles, or null when no quad is emitted, including dry or too-small lattices. It is not a separately measured Float32/GPU bound.
   *
   * One nullable box keeps minimum and maximum absent together.
   */
  bounds: IAutoMovieFluidSurfaceBounds | null;

  /**
   * Per-vertex horizontal velocity [x, z, ...] in m/s, averaging the two faces around each cell on each axis. The viewer copies it into the Float32 aFlow attribute for a supplied shader; no maintained stock material uses it to scroll ripples.
   */
  flow: number[];
}
