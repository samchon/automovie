import { IAutoMovieKeyframe, IAutoMovieMotion } from "@automovie/interface";

/**
 * Package supplied keyframes, duration seconds and loop flag as motion-1 for skeleton-1. Inputs remain borrowed and unvalidated; omission selects loop false without retiming or sorting keys.
 */
export function makeMotion(
  keyframes: IAutoMovieKeyframe[],
  duration: number,
  loop: boolean = false,
): IAutoMovieMotion {
  return {
    id: "motion-1",
    skeleton: "skeleton-1",
    duration,
    loop,
    keyframes,
  };
}
