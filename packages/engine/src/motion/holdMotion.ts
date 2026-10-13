import {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";


/**
 * Hold the supplied pose for a finite positive duration in seconds, retargeting only its skeleton identity; two linear keyframes carry shallow pose copies with shared nested root/joint records and no expression.
 *
 * @evidence contracts/common.md#principled-implementation Equal endpoint pose values produce a constant interval under sampleMotion's interpolation; two endpoints establish a positive-duration non-looping clip without resampling or inventing articulation.
 * @evidence contracts/common.md#clear-and-simple-design The helper owns clip identity, duration admission and endpoint packaging; pose validity and skeleton compatibility remain the caller's rig gate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite or nonpositive duration throws rather than emitting coincident keys; no hidden rest pose replaces the supplied articulation.
 * @evidence contracts/common.md#meaningful-documentation States seconds, two endpoints, skeleton-id override, absent expression and shallow nested-record sharing.
 * @evidence contracts/performance.md#efficient-algorithms Creates two frame/pose wrappers and one clip in constant work and storage, independent of joint count because nested pose data are shared.
 * @evidence contracts/performance.md#reuse-equivalent-work Both endpoints reuse the supplied pose values instead of copying a full rig or running FK; no cache survives across holds.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns output wrappers and continues to share nested root/joints with the input; no retained motion history, timer or handle is acquired.
 */
export const holdMotion: (id: string, skeleton: string, pose: IAutoMoviePose, duration: number) => IAutoMovieMotion = (
  id: string,
  skeleton: string,
  pose: IAutoMoviePose,
  duration: number,
): IAutoMovieMotion => {
  if (!Number.isFinite(duration))
    throw new Error("hold duration must be finite and positive");
  if (duration <= 0)
    throw new Error("hold duration must be finite and positive");

  const frame: (time: number) => IAutoMovieKeyframe = (time: number): IAutoMovieKeyframe => ({
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
