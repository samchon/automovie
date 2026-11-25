import type { AutoMovieLightProperty } from "@automovie/interface";

import { LIGHT_CHANNEL_PROPERTIES } from "./constants/LIGHT_CHANNEL_PROPERTIES";

/** Whether a string names an animatable light property. */
export const isLightProperty: (
  property: string,
) => property is AutoMovieLightProperty = (
  property: string,
): property is AutoMovieLightProperty =>
  Object.hasOwn(LIGHT_CHANNEL_PROPERTIES, property);
