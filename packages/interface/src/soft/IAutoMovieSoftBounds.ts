import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A world-space axis-aligned box.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `IAutoMovieSoftBounds` as the portable data boundary for the effects soft solver state requirement.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `IAutoMovieSoftBounds` for the soft collider and solver transition system contract.
 */
export interface IAutoMovieSoftBounds {
  /**
   * Minimum corner.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `min` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `min` for the soft collider and solver transition system contract.
   */
  min: IAutoMovieVector3;

  /**
   * Maximum corner.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `max` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `max` for the soft collider and solver transition system contract.
   */
  max: IAutoMovieVector3;
}
