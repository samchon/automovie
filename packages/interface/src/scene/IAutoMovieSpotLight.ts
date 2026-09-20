import { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/**
 * Cone-shaped light from a point in a direction.
 *
 * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `IAutoMovieSpotLight` as the portable data boundary for the lighting linking requirement.
 * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `IAutoMovieSpotLight` for the clv light link resolution system contract.
 */
export interface IAutoMovieSpotLight extends IAutoMovieLightBase {
  /**
   * Discriminator.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `type` as the portable data boundary for the lighting linking requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `type` for the clv light link resolution system contract.
   */
  type: "spot";

  /**
   * Range in meters beyond which the light contributes nothing. `0` = infinite.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `range` as the portable data boundary for the lighting linking requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `range` for the clv light link resolution system contract.
   */
  range: number;

  /**
   * Half-angle of the cone in degrees, `(0, 90]`.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `coneAngle` as the portable data boundary for the lighting linking requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `coneAngle` for the clv light link resolution system contract.
   */
  coneAngle: number;
}
