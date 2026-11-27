import type { AutoMovieHumanPoseChannel } from "./AutoMovieHumanPoseChannel";

/** Angular clinical paths accepted by IK; jaw translations/opening are excluded. */
export type AutoMovieHumanPoseDegreeChannel = Exclude<
  AutoMovieHumanPoseChannel,
  `head.jaw.${string}`
>;
