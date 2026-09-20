import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The world-space box a drawn fluid surface occupies.
 *
 * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-surface-flow-tier Exposes `IAutoMovieFluidSurfaceBounds` as the portable data boundary for the effects fluid surface flow tier requirement.
 * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-surface-and-flow-tier Types `IAutoMovieFluidSurfaceBounds` for the fluid surface and flow tier system contract.
 */
export interface IAutoMovieFluidSurfaceBounds {
  /**
   * Minimum corner.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-surface-flow-tier Exposes `min` as the portable data boundary for the effects fluid surface flow tier requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-surface-and-flow-tier Types `min` for the fluid surface and flow tier system contract.
   */
  min: IAutoMovieVector3;

  /**
   * Maximum corner.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-surface-flow-tier Exposes `max` as the portable data boundary for the effects fluid surface flow tier requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-surface-and-flow-tier Types `max` for the fluid surface and flow tier system contract.
   */
  max: IAutoMovieVector3;
}
