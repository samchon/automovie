import {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";

/**
 * Build a non-looping rest-to-arm-pose clip that reaches its supplied clinical pose halfway through a positive second duration, then holds. The endpoint pose is borrowed; the empty rest pose is local.
 *
 * @evidence contracts/common.md#principled-implementation Three keyframes at zero, half-span and span with easeInOut encode the reference point/reach envelope; callers obtain the supplied pose from reachPose.
 * @evidence contracts/common.md#clear-and-simple-design This helper owns the static extension envelope while reachPose owns geometry and the caller owns target resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The half-span policy is fixed choreography, not a measured contact simulation; no ROM clamp is added and downstream validation owns any invalid solved pose.
 * @evidence contracts/common.md#meaningful-documentation States seconds, halfway extension, endpoint pose sharing, empty rest articulation and downstream ROM ownership.
 * @evidence contracts/performance.md#efficient-algorithms Constant keyframe construction independent of rig size; the caller's IK work is not repeated here.
 * @evidence contracts/performance.md#reuse-equivalent-work The same supplied endpoint pose is shared by the two held frames, and this helper performs no repeated IK or target sampling.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned clip; the borrowed pose must remain unchanged during playback, and there is no retained resource.
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
