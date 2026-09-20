import { IAutoMovieFluidSpraySample, IAutoMovieFluidState, IAutoMovieFluidSurface } from "@automovie/interface";

/**
 * One frame of a bound water feature: the state, its surface, and its spray.
 *
 * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Carries the exact solved state and its declared feature identity.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Exposes one coherent frame of the independent fluid domain.
 */
export interface IAutoMovieWaterFeatureFrame {
  /**
   * Identity of the feature the frame belongs to.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Preserves which authored water feature owns the computed frame.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Keeps the feature-to-domain result join addressable.
   */
  feature: string;

  /**
   * The conserved fluid state the frame projects.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Records the computed state derived from the declared initial conditions.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Carries the independent domain state used by both surface and spray.
   */
  state: IAutoMovieFluidState;

  /**
   * Free-surface geometry derived from that state.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes the visible flow surface without inventing another solve.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Projects the independent domain into feature geometry.
   */
  surface: IAutoMovieFluidSurface;

  /**
   * Bounded decorative spray sampled at the same step.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Carries the declared spray population at the surface's step.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Keeps spray and surface on one coherent fluid-domain frame.
   */
  spray: IAutoMovieFluidSpraySample;
}
