import type { AutoMovieLightProperty } from "@automovie/interface";

import { AutoMovieEngineLightChannelProperties } from "../AutoMovieEngineLightChannelProperties";

/*
 * Whether a string names an animatable light property.
 */
export function isLightProperty(
  property: string,
): property is AutoMovieLightProperty {
  return Object.hasOwn(AutoMovieEngineLightChannelProperties, property);
}
