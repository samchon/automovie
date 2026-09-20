import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One resolved capsule using the validation proxy's segment-and-radius meaning.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Reuses the shared body collider representation.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Resolves cloth against a bounded moving capsule.
 */
export interface IAutoMovieSoftBodyResolvedCapsule {
  /**
   * Stable source capsule identity.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Keeps collider identity inspectable.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Preserves collider state across steps.
   */
  id: string;
  /**
   * First resolved segment endpoint.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Uses the current body proxy endpoint.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Supplies one moving capsule endpoint.
   */
  from: IAutoMovieVector3;
  /**
   * Second resolved segment endpoint.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Uses the current body proxy endpoint.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Supplies the other moving capsule endpoint.
   */
  to: IAutoMovieVector3;
  /**
   * Shared proxy radius in metres.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Does not create a second body volume.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Reuses the validation capsule radius.
   */
  radius: number;
}
