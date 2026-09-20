import { IAutoMovieNodeChannel } from "../IAutoMovieNodeChannel";

/**
 * The node properties a channel may address. `channelKey` refuses anything else
 * (it can build no key for it) and the artifact gate refuses it too, so a clip
 * cannot be committed naming a property the pipeline has no writer for.
 *
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-clip-refusal `NODE_CHANNEL_PATHS` enumerates the node target properties admitted before an unsupported clip address reaches playback.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation `NODE_CHANNEL_PATHS` ties track admission to the concrete properties that playback can write.
 */
export const NODE_CHANNEL_PATHS = new Set<IAutoMovieNodeChannel["path"]>([
  "translation",
  "rotation",
  "scale",
  "weights",
]);
