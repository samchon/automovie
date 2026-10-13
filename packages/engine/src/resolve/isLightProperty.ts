import { AutoMovieLightProperty } from "./AutoMovieLightProperty";
import { LIGHT_CHANNEL_PROPERTIES } from "./constants/LIGHT_CHANNEL_PROPERTIES";

/** Whether a string names an animatable light property. */
export const isLightProperty = (
  property: string,
): property is AutoMovieLightProperty =>
  Object.prototype.hasOwnProperty.call(LIGHT_CHANNEL_PROPERTIES, property);
