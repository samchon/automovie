import type { IAutoMovieHumanFingerPose } from "./IAutoMovieHumanFingerPose";
import type { IAutoMovieHumanThumbPose } from "./IAutoMovieHumanThumbPose";

/** Thumb and fingers of one hand, thumb first, then index to little. */
export interface IAutoMovieHumanHandPose {
  /** Thumb. */
  thumb?: IAutoMovieHumanThumbPose;

  /** Index finger. */
  index?: IAutoMovieHumanFingerPose;

  /** Middle finger. */
  middle?: IAutoMovieHumanFingerPose;

  /** Ring finger. */
  ring?: IAutoMovieHumanFingerPose;

  /** Little finger. */
  little?: IAutoMovieHumanFingerPose;
}
