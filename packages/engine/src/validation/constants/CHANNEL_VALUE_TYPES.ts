import { AutoMovieChannelValueType } from "@automovie/interface";

/** The pointer value types a channel may declare. */
export const CHANNEL_VALUE_TYPES = new Set<AutoMovieChannelValueType>([
  "scalar",
  "vec2",
  "vec3",
  "vec4",
  "quaternion",
  "weights",
]);
