import { AutoMovieLightProperty } from "./AutoMovieLightProperty";

/**
 * A parsed light pointer: which staged light, and which of its properties.
 *
 * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Identifies the authored property address for one staged light.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Carries the stable target identity needed to select the correct light branch.
 * @author Samchon
 */
export interface IAutoMovieLightPointer {
  /**
   * Id of the addressed scene light.
   *
   * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Addresses an authored light by stable identity rather than array position.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Selects the staged source whose authority branch receives the channel.
   */
  light: string;

  /**
   * The animatable property.
   *
   * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Names the explicit authored light axis targeted by the pointer.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Selects the property contract within the addressed light branch.
   */
  property: AutoMovieLightProperty;
}
