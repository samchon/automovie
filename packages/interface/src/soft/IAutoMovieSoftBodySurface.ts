import { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import { IAutoMovieSoftBounds } from "./IAutoMovieSoftBounds";

/**
 * The derived drawable geometry of one soft-body state.
 *
 * The engine owns this derivation so the renderer stays a projection: the mesh
 * a viewer uploads and the particle field the solver produced are one
 * statement, not two that can disagree.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `IAutoMovieSoftBodySurface` as the portable data boundary for the effects soft solver state requirement.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `IAutoMovieSoftBodySurface` for the soft collider and solver transition system contract.
 */
export interface IAutoMovieSoftBodySurface {
  /**
   * Identity of the domain the surface was derived from.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `domain` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `domain` for the soft collider and solver transition system contract.
   */
  domain: string;

  /**
   * Absolute step the surface was derived at.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `step` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `step` for the soft collider and solver transition system contract.
   */
  step: number;

  /**
   * Triangulated panel. One vertex per particle in row-major order, so a vertex
   * index and a particle index are the same number, and two triangles per
   * lattice quad. Normals are area-weighted from the incident triangles and UVs
   * are the normalized lattice coordinates, so a fabric pattern does not swim
   * as the panel folds.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `mesh` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `mesh` for the soft collider and solver transition system contract.
   */
  mesh: IAutoMovieMesh;

  /**
   * World extent of the panel, or `null` when no triangle was emitted at all —
   * a lattice too thin to hold one quad.
   *
   * One nullable box rather than a nullable minimum beside a nullable maximum:
   * the two can only ever be absent together, and a pair that must agree is a
   * pair that can be made to disagree.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `bounds` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `bounds` for the soft collider and solver transition system contract.
   */
  bounds: IAutoMovieSoftBounds | null;
}
