import {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";

/**
 * Build a non-looping rest-to-strike-to-rest clip with a 40% peak over a
 * positive second duration. The supplied clinical strike pose is borrowed and
 * the empty rest pose is shared only within this clip.
 */
export const createActorJabClip: (
  id: string,
  skeleton: string,
  pose: IAutoMoviePose,
  duration: number,
) => IAutoMovieMotion = (
  id: string,
  skeleton: string,
  pose: IAutoMoviePose,
  duration: number,
): IAutoMovieMotion => {
  const rest: IAutoMoviePose = { skeleton, root: null, joints: [] };
  const key: (
    time: number,
    p: IAutoMoviePose,
    easing: IAutoMovieKeyframe["easing"],
  ) => IAutoMovieKeyframe = (
    time: number,
    p: IAutoMoviePose,
    easing: IAutoMovieKeyframe["easing"],
  ): IAutoMovieKeyframe => ({
    time,
    pose: p,
    expression: null,
    easing,
    bezier: null,
  });
  return {
    id,
    skeleton,
    duration,
    loop: false,
    keyframes: [
      key(0, rest, "easeIn"),
      key(duration * 0.4, pose, "easeOut"),
      key(duration, rest, "easeInOut"),
    ],
  };
};
