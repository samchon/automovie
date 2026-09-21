import { IAutoMovieKeyframe, IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";

/**
 * Hold a single pose for `duration` seconds: the simplest "action" an actor can
 * perform (a beat of stillness), and the filler the timeline composer uses
 * across gaps. A two-keyframe clip with the same pose at both ends.
 *
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-sparse-channel-default Makes an explicit constant state span instead of inventing motion across an empty interval.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Encodes the hold as two ordered keys with identical state.
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
