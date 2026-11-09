import {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";

/**
 * Build a non-looping rest-to-strike-to-rest clip with a 40% peak over a positive second duration. The supplied clinical strike pose is borrowed and the empty rest pose is shared only within this clip.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Three keyframes use easeIn before the strike and easeOut after it, preserving the reference synthesizer's declared snap-and-retract timing.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This helper owns the static jab envelope; target resolution and reachPose solve happen in the calling gesture branch.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 40% peak is a choreography policy with no collision solve or hidden ROM clamp; downstream gates decide whether the authored result is acceptable.
 * @evidence contracts/development/common.md#meaningful-documentation States positive seconds, 40% peak, borrowed strike pose and invocation-local shared rest endpoints.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant construction of three keyframes and one empty rest pose; no skeleton or target resampling occurs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both rest endpoints share the invocation's rest pose, while the solved strike pose is reused at its peak without another IK call.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the result and must preserve borrowed pose data during playback; no process, task or persistent cache is acquired.
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
