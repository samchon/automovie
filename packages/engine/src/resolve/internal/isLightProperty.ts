import type { AutoMovieLightProperty } from "@automovie/interface";

import { LIGHT_CHANNEL_PROPERTIES } from "../LIGHT_CHANNEL_PROPERTIES";

/** Whether a string names an animatable light property. */
export function isLightProperty(
  property: string,
): property is AutoMovieLightProperty {
  return Object.hasOwn(LIGHT_CHANNEL_PROPERTIES, property);
}
