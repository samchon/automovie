import type { IAutoMovieFluidSpraySample } from "./IAutoMovieFluidSpraySample";
import type { IAutoMovieFluidState } from "./IAutoMovieFluidState";
import type { IAutoMovieFluidSurface } from "./IAutoMovieFluidSurface";

/**
 * One bound-water-feature frame returned by lowerWaterFeature: solved state,
 * drawable surface and decorative spray, all produced from one state in that
 * call. This structural interface does not enforce matching steps on
 * caller-constructed records; child numerical/admission limits still apply.
 */
export interface IAutoMovieWaterFeatureFrame {
  /** Id of the `IAutoMovieWaterFeature` the frame belongs to. */
  feature: string;

  /** The solved fluid state, step 0 for a `static` feature. */
  state: IAutoMovieFluidState;

  /** Free-surface geometry derived from `state`. */
  surface: IAutoMovieFluidSurface;

  /**
   * Bounded decorative spray sampled from `state` at the requested camera
   * distance.
   */
  spray: IAutoMovieFluidSpraySample;
}
