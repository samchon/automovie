import { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/**
 * Omni-directional light radiating from a point, with distance falloff.
 *
 * @evidence requirements/lighting/sources-and-photometry.md#lighting-distance-falloff Exposes `IAutoMoviePointLight` as the portable data boundary for the lighting distance falloff requirement.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-distribution-color Types `IAutoMoviePointLight` for the clv source distribution color system contract.
 */
export interface IAutoMoviePointLight extends IAutoMovieLightBase {
  /**
   * Discriminator.
   *
   * @evidence requirements/lighting/sources-and-photometry.md#lighting-distance-falloff Exposes `type` as the portable data boundary for the lighting distance falloff requirement.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-distribution-color Types `type` for the clv source distribution color system contract.
   */
  type: "point";

  /**
   * Range in meters beyond which the light contributes nothing. `0` = infinite.
   *
   * @evidence requirements/lighting/sources-and-photometry.md#lighting-distance-falloff Exposes `range` as the portable data boundary for the lighting distance falloff requirement.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-distribution-color Types `range` for the clv source distribution color system contract.
   */
  range: number;
}
