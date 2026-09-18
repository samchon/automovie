import { AutoMovieLightProperty } from "./AutoMovieLightProperty";
import { LIGHT_CHANNEL_PROPERTIES } from "./LIGHT_CHANNEL_PROPERTIES";

/**
 * Whether a string names an animatable light property.
 *
 * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Restricts authored animation to the registered light-property surface.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Confirms that a property has an explicit branch-aware application contract.
 */
export const isLightProperty = (
  property: string,
): property is AutoMovieLightProperty =>
  Object.prototype.hasOwnProperty.call(LIGHT_CHANNEL_PROPERTIES, property);
