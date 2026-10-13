import {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";

/**
 * Hold a single pose for `duration` seconds: the simplest "action" an actor can
 * perform (a beat of stillness), and the filler the timeline composer uses
 * across gaps. A two-keyframe clip with the same pose at both ends.
 *
 * @author Samchon
 */
export const holdMotion = (
  id: string,
  skeleton: string,
  pose: IAutoMoviePose,
  duration: number,
): IAutoMovieMotion => {
  if (!Number.isFinite(duration))
    throw new Error("hold duration must be finite and positive");
  if (duration <= 0)
    throw new Error("hold duration must be finite and positive");

  const frame = (time: number): IAutoMovieKeyframe => ({
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
};
