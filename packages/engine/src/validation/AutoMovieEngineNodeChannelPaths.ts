import type { IAutoMovieNodeChannel } from "@automovie/interface";

/**
 * The node properties a channel may address. `channelKey` refuses anything else
 * (it can build no key for it) and the artifact gate refuses it too, so a clip
 * cannot be committed naming a property the pipeline has no writer for.
 */
export const AutoMovieEngineNodeChannelPaths = new Set<IAutoMovieNodeChannel["path"]>([
  "translation",
  "rotation",
  "scale",
  "weights",
]);
