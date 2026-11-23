import type { IAutoMovieExpression } from "../expression/IAutoMovieExpression";
import type { IAutoMoviePose } from "../pose/IAutoMoviePose";

/**
 * A pose plus optional expression sampled at one instant of a clip.
 * sampleMotion retargets pose.skeleton to the motion id, interpolates clinical
 * joint degrees and root TRS, and uses null when neither endpoint expresses.
 * Endpoint expressions and nested endpoint pose data may alias the clip.
 */
export interface IAutoMovieMotionSample {
  /** Interpolated body pose at the sampled instant. */
  pose: IAutoMoviePose;

  /** Interpolated expression, or `null` when the motion has none. */
  expression: IAutoMovieExpression | null;
}
