import {
  IAutoMovieFluidSpraySample,
  IAutoMovieFluidState,
  IAutoMovieFluidSurface,
} from "@automovie/interface";

/**
 * One frame of a bound water feature: the state, its surface, and its spray.
 */
export interface IAutoMovieWaterFeatureFrame {
  /** Identity of the feature the frame belongs to. */
  feature: string;

  /** The conserved fluid state the frame projects. */
  state: IAutoMovieFluidState;

  /** Free-surface geometry derived from that state. */
  surface: IAutoMovieFluidSurface;

  /** Bounded decorative spray sampled at the same step. */
  spray: IAutoMovieFluidSpraySample;
}
