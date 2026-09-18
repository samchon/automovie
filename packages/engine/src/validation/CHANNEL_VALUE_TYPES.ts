import { AutoMovieChannelValueType } from "@automovie/interface";
import { IAutoMovieNodeChannel } from "./IAutoMovieNodeChannel";
import { IAutoMoviePointerChannel } from "@automovie/interface";

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

/**
 * Per-keyframe value width of the channels that fix one. `weights` is absent
 * from both tables on purpose: a morph-target vector is as wide as the model
 * has targets, so no width can be asserted for it.
 */
const NODE_CHANNEL_WIDTHS: Partial<
  Record<IAutoMovieNodeChannel["path"], number>
> = {
  translation: 3,
  rotation: 4,
  scale: 3,
};

const CHANNEL_VALUE_WIDTHS: Partial<
  Record<IAutoMoviePointerChannel["valueType"], number>
> = {
  scalar: 1,
  vec2: 2,
  vec3: 3,
  vec4: 4,
  quaternion: 4,
};
