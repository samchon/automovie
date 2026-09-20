import { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import { IAutoMovieFluidSurfaceBounds } from "./IAutoMovieFluidSurfaceBounds";

/**
 * The derived free-surface geometry of one fluid state.
 *
 * The engine owns this derivation so the renderer stays a projection: the mesh
 * a viewer uploads and the depth field the solver produced are one statement,
 * not two that can disagree.
 *
 * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-surface-flow-tier Exposes `IAutoMovieFluidSurface` as the portable data boundary for the effects fluid surface flow tier requirement.
 * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-surface-and-flow-tier Types `IAutoMovieFluidSurface` for the fluid surface and flow tier system contract.
 */
export interface IAutoMovieFluidSurface {
  /**
   * Identity of the domain the surface was derived from.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-surface-flow-tier Exposes `domain` as the portable data boundary for the effects fluid surface flow tier requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-surface-and-flow-tier Types `domain` for the fluid surface and flow tier system contract.
   */
  domain: string;

  /**
   * Absolute step the surface was derived at.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-surface-flow-tier Exposes `step` as the portable data boundary for the effects fluid surface flow tier requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-surface-and-flow-tier Types `step` for the fluid surface and flow tier system contract.
   */
  step: number;

  /**
   * Triangulated free surface in world space. Vertices sit at cell centres, one
   * per cell including dry ones, so vertex order is the row-major cell order;
   * only quads whose four corner cells are wet and non-solid are triangulated,
   * which is what makes a dry basin draw nothing.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-surface-flow-tier Exposes `mesh` as the portable data boundary for the effects fluid surface flow tier requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-surface-and-flow-tier Types `mesh` for the fluid surface and flow tier system contract.
   */
  mesh: IAutoMovieMesh;

  /**
   * World extent of the drawn surface, or `null` when no quad was emitted at
   * all — a drained basin, or a lattice too small to hold one.
   *
   * One nullable box rather than a nullable minimum beside a nullable maximum:
   * the two can only ever be absent together, and a pair that must agree is a
   * pair that can be made to disagree.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-surface-flow-tier Exposes `bounds` as the portable data boundary for the effects fluid surface flow tier requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-surface-and-flow-tier Types `bounds` for the fluid surface and flow tier system contract.
   */
  bounds: IAutoMovieFluidSurfaceBounds | null;

  /**
   * Per-vertex horizontal flow velocity `[x, z, ...]` in m/s, aligned to the
   * mesh vertices: the cell-centred average of the four surrounding faces. A
   * renderer scrolls ripples along it; it never re-derives it.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-surface-flow-tier Exposes `flow` as the portable data boundary for the effects fluid surface flow tier requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-surface-and-flow-tier Types `flow` for the fluid surface and flow tier system contract.
   */
  flow: number[];
}
