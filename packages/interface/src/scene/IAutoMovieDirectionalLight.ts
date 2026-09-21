import { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/**
 * Infinitely-distant parallel light (sun). No distance falloff.
 *
 * @evidence requirements/lighting/sources-and-photometry.md#lighting-distance-falloff Exposes `IAutoMovieDirectionalLight` as the portable data boundary for the lighting distance falloff requirement.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-distribution-color Types `IAutoMovieDirectionalLight` for the clv source distribution color system contract.
 */
export interface IAutoMovieDirectionalLight extends IAutoMovieLightBase {
  /**
   * Discriminator.
   *
   * @evidence requirements/lighting/sources-and-photometry.md#lighting-distance-falloff Exposes `type` as the portable data boundary for the lighting distance falloff requirement.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-distribution-color Types `type` for the clv source distribution color system contract.
   */
  type: "directional";
}
