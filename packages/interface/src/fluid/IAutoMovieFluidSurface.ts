import { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import { IAutoMovieFluidSurfaceBounds } from "./IAutoMovieFluidSurfaceBounds";

/**
 * The derived free-surface geometry of one fluid state.
 *
 * The engine owns this derivation so the renderer stays a projection: the mesh
 * a viewer uploads and the depth field the solver produced are one statement,
 * not two that can disagree. `fluidSurfaceGeometry` produces it and throws when
 * the state's `domain` is not the domain's id.
 *
 * @evidence contracts/common.md#principled-implementation One vertex per cell centre at `origin.y + bed + depth` with central-difference surface normals, triangulating only quads whose four corners are wet and non-solid, so the drawn water is a direct projection of the solved depth field.
 * @evidence contracts/common.md#clear-and-simple-design Mesh, bounds and per-vertex flow travel as one record keyed by domain and step, so a viewer uploads one object and never recomputes geometry or flow from the state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No basin shape is special-cased; dry vertices stay in the buffer so vertex and cell indices match while their quads are dropped, and `bounds` covers emitted triangles only so a drained rim does not widen culling.
 * @evidence contracts/common.md#meaningful-documentation States the vertex order, the quad rule, the normal, UV and winding conventions, the meaning of a `null` bound, the flow unit and alignment, its current reader, and the foreign-state refusal.
 * @author Samchon
 */
export interface IAutoMovieFluidSurface {
  /** Identity of the domain the surface was derived from. */
  domain: string;

  /** Absolute step the surface was derived at. */
  step: number;

  /**
   * Triangulated free surface in world space. Vertices sit at cell centres, one
   * per cell including dry ones, so vertex order is the row-major cell order;
   * only quads whose four corner cells are wet and non-solid are triangulated,
   * which is what makes a dry basin draw nothing. Normals are the central
   * difference of the free surface (`(0, 1, 0)` on a single-cell axis), UVs run
   * from 0 to 1 across the lattice, triangles wind counter-clockwise seen from
   * above, and `skin` is `null`.
   */
  mesh: IAutoMovieMesh;

  /**
   * World extent of the drawn surface, or `null` when no quad was emitted at
   * all — a drained basin, or a lattice too small to hold one.
   *
   * One nullable box rather than a nullable minimum beside a nullable maximum:
   * the two can only ever be absent together, and a pair that must agree is a
   * pair that can be made to disagree.
   */
  bounds: IAutoMovieFluidSurfaceBounds | null;

  /**
   * Per-vertex horizontal flow velocity `[x, z, ...]` in m/s, aligned to the
   * mesh vertices: the cell-centred average of the two faces on each axis. The
   * viewer uploads it as the `aFlow` attribute for a ripple shader to scroll
   * along (none in this repository reads it yet); no consumer re-derives it.
   */
  flow: number[];
}
