import type { AutoMovieHumanPoseChannel } from "./AutoMovieHumanPoseChannel";

/** Canonical jaw translation/opening paths, whose scalar unit is millimetres. */
export type AutoMovieHumanPoseMillimetreChannel = Extract<
  AutoMovieHumanPoseChannel,
  `head.jaw.${string}`
>;
