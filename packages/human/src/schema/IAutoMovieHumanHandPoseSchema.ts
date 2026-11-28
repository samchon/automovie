import type { IAutoMovieHumanHandPose } from "@automovie/interface";

import type { IAutoMovieHumanFingerPoseSchema } from "./IAutoMovieHumanFingerPoseSchema";
import type { IAutoMovieHumanThumbPoseSchema } from "./IAutoMovieHumanThumbPoseSchema";

/**
 * One hand's optional digit angles for typia validation. The thumb has its own
 * channels. The index, middle, ring and little fingers share the same channel
 * shape. All angles use degrees from neutral.
 */
export type IAutoMovieHumanHandPoseSchema = IAutoMovieHumanHandPose & {
  /** Thumb. */
  thumb?: IAutoMovieHumanThumbPoseSchema;

  /** Index finger. */
  index?: IAutoMovieHumanFingerPoseSchema;

  /** Middle finger. */
  middle?: IAutoMovieHumanFingerPoseSchema;

  /** Ring finger. */
  ring?: IAutoMovieHumanFingerPoseSchema;

  /** Little finger. */
  little?: IAutoMovieHumanFingerPoseSchema;
};
