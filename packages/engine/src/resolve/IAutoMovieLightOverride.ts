import { IAutoMovieColor, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * The animatable property values accumulated for one light before they are
 * folded back onto it. Every field absent means the light is returned
 * unchanged, by identity.
 *
 * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Carries only the explicit authored light-channel values sampled at an instant.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Represents a partial update without replacing the staged light's authority branch.
 * @author Samchon
 */
export interface IAutoMovieLightOverride {
  /**
   * Radiant intensity, when an `intensity` track wrote one.
   *
   * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Carries the sampled authored intensity instead of deriving brightness from appearance.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Applies intensity only when its authored channel owns the value.
   */
  intensity?: number;

  /**
   * Linear colour, when a `color` track wrote one.
   *
   * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Carries the sampled authored linear colour of the light source.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Applies colour within the selected authored light branch.
   */
  color?: IAutoMovieColor;

  /**
   * Falloff range in metres, when a `range` track wrote one.
   *
   * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Carries the sampled range only for authored light kinds that own falloff distance.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Preserves kind-specific range authority in the partial light update.
   */
  range?: number;

  /**
   * Cone half-angle in degrees, when a `coneAngle` track wrote one.
   *
   * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Carries the explicit spot cone angle sampled from its authored channel.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Keeps cone authority confined to the spot-light branch.
   */
  coneAngle?: number;

  /**
   * World translation in metres, when a `position` track wrote one.
   *
   * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Carries the sampled authored placement of a movable light.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Applies position only to light kinds whose authority includes a location.
   */
  position?: IAutoMovieVector3;

  /**
   * World orientation, when a `rotation` track wrote one.
   *
   * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Carries the sampled authored orientation of a directional light source.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Applies rotation only to branches whose illumination has a direction.
   */
  rotation?: IAutoMovieQuaternion;
}
