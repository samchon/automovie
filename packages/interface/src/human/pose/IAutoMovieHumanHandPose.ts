import type { IAutoMovieHumanFingerPose } from "./IAutoMovieHumanFingerPose";
import type { IAutoMovieHumanThumbPose } from "./IAutoMovieHumanThumbPose";

/** Thumb and fingers of one hand, thumb first, then index to little.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Thumb and fingers of one hand, thumb first, then index to little.
 * @evidence contracts/development/design.md#principled-representation `thumb`: Thumb. `index`: Index finger. `middle`: Middle finger.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandPose is the canonical exchange used by IAutoMovieHumanHandPoseSchema, IAutoMovieHumanArmPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `thumb`: Thumb. `index`: Index finger. `middle`: Middle finger. `ring`: Ring finger. `little`: Little finger.
 */
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
