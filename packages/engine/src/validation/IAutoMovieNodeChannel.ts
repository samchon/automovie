import { IAutoMovieChannel } from "@automovie/interface";

/**
 * The node channel arm, and the property set {@link NODE_CHANNEL_PATHS} spans.
 *
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-clip-refusal `IAutoMovieNodeChannel` narrows track admission to the node-channel arm whose target property playback can reproduce.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation `IAutoMovieNodeChannel` preserves the node discriminator and property path declared by one typed clip channel.
 */
export type IAutoMovieNodeChannel = Extract<
  IAutoMovieChannel,
  { kind: "node" }
>;
