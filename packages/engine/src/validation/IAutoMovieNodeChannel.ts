import { IAutoMovieChannel } from "@automovie/interface";

/**
 * The node channel arm, and the property set {@link NODE_CHANNEL_PATHS} spans.
 */
export type IAutoMovieNodeChannel = Extract<
  IAutoMovieChannel,
  { kind: "node" }
>;
