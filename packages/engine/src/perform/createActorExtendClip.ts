import {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";

/**
 * Build a non-looping rest-to-arm-pose clip that reaches its supplied clinical
 * pose halfway through a positive second duration, then holds. The endpoint
 * pose is borrowed; the empty rest pose is local.
 */
export const createActorExtendClip: (
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
  const key: (time: number, p: IAutoMoviePose) => IAutoMovieKeyframe = (
    time: number,
    p: IAutoMoviePose,
  ): IAutoMovieKeyframe => ({
    time,
    pose: p,
    expression: null,
    easing: "easeInOut",
    bezier: null,
  });
  return {
    id,
    skeleton,
    duration,
    loop: false,
    keyframes: [key(0, rest), key(duration * 0.5, pose), key(duration, pose)],
  };
};
