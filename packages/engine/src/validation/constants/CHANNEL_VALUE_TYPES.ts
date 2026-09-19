import { AutoMovieChannelValueType } from "@automovie/interface";

/**
 * The pointer value types a channel may declare.
 *
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-interpolation `CHANNEL_VALUE_TYPES` names the typed pointer payloads whose interpolation semantics a track may declare.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation `CHANNEL_VALUE_TYPES` bounds pointer-channel interpretation before its per-key value stride is checked.
 */
export const CHANNEL_VALUE_TYPES = new Set<AutoMovieChannelValueType>([
  "scalar",
  "vec2",
  "vec3",
  "vec4",
  "quaternion",
  "weights",
]);
