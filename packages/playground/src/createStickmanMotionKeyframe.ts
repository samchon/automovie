import type { IAutoMovieKeyframe, IAutoMoviePose } from "@automovie/interface";

/**
 * Wrap an authored pose at a second-based instant using outgoing easeInOut interpolation, with no expression or custom Bezier controls. Ordering, duration and ROM remain clip/engine admission responsibilities.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The standard keyframe schema carries exact time and pose plus the existing easing choice; absent expression/Bezier remain explicit null rather than synthetic animation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal constructor supports current choreography and delegates ordering/interpolation to clip and engine owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A constructed frame does not establish finite ordered timing, valid joint capacity or a visually completed motion.
 * @evidence contracts/development/common.md#meaningful-documentation The comment defines seconds, outgoing easing, absent expression/Bezier and separate admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant wrapper work borrows the pose without scanning its joints; actual motion sampling and rendering occur later.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Repeated keyframes may reference the same authored pose vocabulary; no sampled-pose cache is maintained here.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned keyframe belongs to its clip while pose records remain borrowed; no external handle or running task is acquired.
 */
export function createStickmanMotionKeyframe(
  time: number,
  pose: IAutoMoviePose,
): IAutoMovieKeyframe {
  return { time, pose, expression: null, easing: "easeInOut", bezier: null };
}
