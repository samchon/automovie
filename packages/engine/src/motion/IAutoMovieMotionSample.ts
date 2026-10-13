import { IAutoMovieExpression, IAutoMoviePose } from "@automovie/interface";

/**
 * A pose plus optional expression sampled at one instant of a clip.
 *
 * @author Samchon
 */
export interface IAutoMovieMotionSample {
  /** Interpolated body pose at the sampled instant. */
  pose: IAutoMoviePose;
  /** Interpolated expression, or `null` when the motion has none. */
  expression: IAutoMovieExpression | null;
}
