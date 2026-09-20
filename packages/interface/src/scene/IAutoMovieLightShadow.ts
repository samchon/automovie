/**
 * Renderer-independent shadow map controls shared by physical lights.
 *
 * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `IAutoMovieLightShadow` as the portable data boundary for the lighting linking requirement.
 * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `IAutoMovieLightShadow` for the clv light link resolution system contract.
 */
export interface IAutoMovieLightShadow {
  /**
   * Square shadow-map resolution, a positive safe integer.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `mapSize` as the portable data boundary for the lighting linking requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `mapSize` for the clv light link resolution system contract.
   */
  mapSize: number;

  /**
   * Depth bias used to suppress surface acne.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `bias` as the portable data boundary for the lighting linking requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `bias` for the clv light link resolution system contract.
   */
  bias: number;

  /**
   * Normal-relative depth bias.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `normalBias` as the portable data boundary for the lighting linking requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `normalBias` for the clv light link resolution system contract.
   */
  normalBias: number;

  /**
   * Positive shadow-camera near distance.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `near` as the portable data boundary for the lighting linking requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `near` for the clv light link resolution system contract.
   */
  near: number;

  /**
   * Shadow-camera far distance, greater than `near`.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `far` as the portable data boundary for the lighting linking requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `far` for the clv light link resolution system contract.
   */
  far: number;
}
