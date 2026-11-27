import type { IAutoMovieHumanPose } from "./IAutoMovieHumanPose";
import type { IAutoMovieHumanRigControls } from "./IAutoMovieHumanRigControls";

/** Every numeric leaf in the existing public pose; jaw leaves use millimetres. */
export type AutoMovieHumanPoseChannel =
  IAutoMovieHumanRigControls.NumericPath<IAutoMovieHumanPose>;
