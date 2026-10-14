import type { IAutoMovieKeyframe, IAutoMoviePose } from "@automovie/interface";

/**
 * Wrap an authored pose at a second-based instant using outgoing easeInOut interpolation, with no expression or custom Bezier controls. Ordering, duration and ROM remain clip/engine admission responsibilities.
 *
 * @evidence contracts/common.md#principled-implementation The standard keyframe schema carries exact time and pose plus the existing easing choice; absent expression/Bezier remain explicit null rather than synthetic animation.
 * @evidence contracts/common.md#clear-and-simple-design One literal constructor supports current choreography and delegates ordering/interpolation to clip and engine owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A constructed frame does not establish finite ordered timing, valid joint capacity or a visually completed motion.
 * @evidence contracts/common.md#meaningful-documentation The comment defines seconds, outgoing easing, absent expression/Bezier and separate admission.
 * @evidence contracts/performance.md#efficient-algorithms Constant wrapper work borrows the pose without scanning its joints; actual motion sampling and rendering occur later.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated keyframes may reference the same authored pose vocabulary; no sampled-pose cache is maintained here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned keyframe belongs to its clip while pose records remain borrowed; no external handle or running task is acquired.
 *
 * @author Samchon
 */
export function createStickmanMotionKeyframe(
  time: number,
  pose: IAutoMoviePose,
): IAutoMovieKeyframe {
  return { time, pose, expression: null, easing: "easeInOut", bezier: null };
}
