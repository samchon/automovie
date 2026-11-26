import {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";

/**
 * Hold the supplied pose for a finite positive duration in seconds, retargeting
 * only its skeleton identity; two linear keyframes carry shallow pose copies
 * with shared nested root/joint records and no expression.
 */
export function holdMotion(
  id: string,
  skeleton: string,
  pose: IAutoMoviePose,
  duration: number,
): IAutoMovieMotion {
  if (duration <= 0)
    throw new Error("hold duration must be finite and positive");

  const frame: (time: number) => IAutoMovieKeyframe = (
    time: number,
  ): IAutoMovieKeyframe => ({
    time,
    pose: { ...pose, skeleton },
    expression: null,
    easing: "linear",
    bezier: null,
  });
  return {
    id,
    skeleton,
    duration,
    loop: false,
    keyframes: [frame(0), frame(duration)],
  };
}
