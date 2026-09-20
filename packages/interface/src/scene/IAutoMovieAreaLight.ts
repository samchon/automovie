import { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/**
 * A rectangular emissive panel: a softbox, a window, a light strip, a luminous
 * ceiling coffer.
 *
 * The one light kind with EXTENT. A punctual source has a position and no size,
 * so its terminator is hard however far away it stands; a built interior is
 * mostly lit by surfaces, and the soft wrap those surfaces give is a function
 * of the panel's width and height, not of an intensity an author could tune to
 * imitate it.
 *
 * The panel occupies its transform's local XY plane and emits from the face its
 * local −Z points at, which is the same convention every aimed light here uses,
 * so one `direction` reads identically on a spot and on a window. It has no
 * distance falloff parameter: the inverse-square term follows from the panel's
 * own area, so a `range` would be a second, contradictory falloff.
 *
 * Maps onto `three.js` `RectAreaLight`, which lights only physically-based
 * materials and casts no shadow map (see
 * {@link IAutoMovieLightBase.castShadow}). It has no glTF `KHR_lights_punctual`
 * counterpart, which is exactly why it is modeled here rather than borrowed.
 *
 * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-link-resolution Exposes `IAutoMovieAreaLight` as the portable data boundary for the lighting link resolution requirement.
 * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `IAutoMovieAreaLight` for the clv light link resolution system contract.
 */
export interface IAutoMovieAreaLight extends IAutoMovieLightBase {
  /**
   * Discriminator.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-link-resolution Exposes `type` as the portable data boundary for the lighting link resolution requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `type` for the clv light link resolution system contract.
   */
  type: "area";

  /**
   * Panel width in meters along its local X axis, finite and `> 0`.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-link-resolution Exposes `width` as the portable data boundary for the lighting link resolution requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `width` for the clv light link resolution system contract.
   */
  width: number;

  /**
   * Panel height in meters along its local Y axis, finite and `> 0`.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-link-resolution Exposes `height` as the portable data boundary for the lighting link resolution requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `height` for the clv light link resolution system contract.
   */
  height: number;
}
