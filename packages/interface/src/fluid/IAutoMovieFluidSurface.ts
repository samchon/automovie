import { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import { IAutoMovieFluidSurfaceBounds } from "./IAutoMovieFluidSurfaceBounds";

/**
 * The derived free-surface geometry of one fluid state.
 *
 * The engine owns this derivation so the renderer stays a projection: the mesh
 * a viewer uploads and the depth field the solver produced are one statement,
 * not two that can disagree. `fluidSurfaceGeometry` produces it and throws when
 * the state's `domain` is not the domain's id; the viewer's
 * `buildFluidSurfaceObject` uploads it unchanged.
 *
 * @evidence contracts/common.md#principled-implementation `fluidSurfaceGeometry` places one vertex per cell at `origin.y + bed + depth`, takes normals from finite differences of that free surface, and triangulates a quad only when its four corner cells are wet and not solid, so the drawn water is read directly off the solved depth field.
 * @evidence contracts/common.md#clear-and-simple-design The surface reuses the shared `IAutoMovieMesh` shape and adds only the domain, the step, the drawn extent and the per-vertex flow, which are the facts a viewer needs beyond plain geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Dry vertices stay in the buffer so vertex and cell indices coincide, and `bounds` excludes them so culling never measures water that is not drawn; the remaining gap is that no shader reads `flow` yet.
 * @evidence contracts/common.md#meaningful-documentation States why the engine owns the derivation, the producer and its refusal, and the viewer consumer; members give vertex order, the triangulation rule, normals, UVs, winding, when `bounds` is null and why it is one box, and the flow layout and reader.
 * @author Samchon
 */
export interface IAutoMovieFluidSurface {
  /** Id of the domain the surface was derived from. */
  domain: string;

  /** Absolute step the surface was derived at. */
  step: number;

  /**
   * Triangulated free surface in world space. Vertices sit at cell centres, one
   * per cell including dry ones, so vertex order is the row-major cell order;
   * only quads whose four corner cells are wet and non-solid are triangulated,
   * which is what makes a dry basin draw nothing.
   *
   * Normals come from central differences of the free surface, one-sided at
   * the lattice edge, and an axis with a single cell contributes no slope. UVs
   * run from 0 to 1 across the lattice and stay 0 along a single-cell axis,
   * triangles wind counter-clockwise seen from above, and `skin` is `null`.
   */
  mesh: IAutoMovieMesh;

  /**
   * World extent of the drawn surface, or `null` when no quad was emitted at
   * all: a drained basin, or a lattice too small to hold one.
   *
   * One nullable box rather than a nullable minimum beside a nullable maximum,
   * because the two can only ever be absent together.
   */
  bounds: IAutoMovieFluidSurfaceBounds | null;

  /**
   * Per-vertex horizontal flow velocity `[x, z, ...]` in m/s, aligned to the
   * mesh vertices: the average of the two faces bounding each cell on each
   * axis. The viewer uploads it as the `aFlow` attribute for a ripple shader to
   * scroll along, though none in this repository reads it yet; no consumer
   * re-derives it.
   */
  flow: number[];
}
