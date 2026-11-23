import type { IAutoMovieHumanPoseChannels } from "./IAutoMovieHumanPoseChannels";
import type { IAutoMovieHumanRigControls } from "./IAutoMovieHumanRigControls";

/**
 * Exact Human FK joint identities, including original custom finger/foot
 * joints.
 */
export type AutoMovieHumanJointName = IAutoMovieHumanRigControls.Expand<
  (readonly IAutoMovieHumanPoseChannels.Channel[])[number][1]
>;
