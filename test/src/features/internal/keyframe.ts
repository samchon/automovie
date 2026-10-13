import { IAutoMovieExpression, IAutoMovieKeyframe, IAutoMoviePose } from "@automovie/interface";

/**
 * Create a keyframe at the supplied time in seconds, borrowing pose/expression and selecting linear easing by default. Bezier stays null so tests must author any alternate interpolation metadata explicitly.
 */
export function keyframe(
  time: number,
  pose: IAutoMoviePose,
  easing: IAutoMovieKeyframe["easing"] = "linear",
  expression: IAutoMovieExpression | null = null
): IAutoMovieKeyframe {
  return ({ time, pose, expression, easing, bezier: null });
}
