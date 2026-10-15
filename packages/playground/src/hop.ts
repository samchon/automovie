import type { IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";

import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { createStickmanMotionRoot as root } from "./createStickmanMotionRoot";

/**
 * Authored one-second hop loop with stand/crouch/apex/crouch/stand keys. Root height moves through -0.12 and +0.26 metres; apex upper-arm abduction retains the existing 210-degree overshoot. Times/roots/angles are conventional choreography, not ballistic gravity, clinical capacity or verified floor contact.
 *
 * @evidence contracts/common.md#principled-implementation Three explicit whole-body poses and metre roots form a value-closed five-frame cycle with exact authored timing and easeInOut interpolation.
 * @evidence contracts/common.md#clear-and-simple-design Stand/crouch/apex vocabulary keeps this display motion local without introducing a jump simulator or secondary body evaluator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Legacy overhead overshoot and authored vertical displacement remain disclosed; this clip performs no ROM, ground or impulse admission.
 * @evidence contracts/common.md#meaningful-documentation The comment gives frame sequence, metre height extrema, duration and the retained 210-degree qualification limit.
 * @evidence contracts/performance.md#efficient-algorithms Three bounded pose/root records and five keys bound assembly; rendering and interpolated FK remain ordinary engine/viewer costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated stand/crouch frames share the same authored pose records within one clip; calls return fresh vocabulary rather than cached mutable output.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-owned frames retain shared local poses/roots, so consumers preserve those shared values; no physics task, timer or GPU handle is acquired.
 *
 * @author Samchon
 */
export const hop: (sk: string) => IAutoMovieMotion = (
  sk: string,
): IAutoMovieMotion => {
  // Arms specified in every keyframe (no rest-T-pose snap): down at rest, swept
  // back in the crouch, thrown up at the apex.
  const stand: IAutoMoviePose = pose(
    sk,
    [
      j("leftUpperArm", { abduction: 28 }),
      j("rightUpperArm", { abduction: 28 }),
    ],
    root(0, 0, 0, 0),
  );
  const crouch: IAutoMoviePose = pose(
    sk,
    [
      j("leftUpperLeg", { flexion: 26 }),
      j("rightUpperLeg", { flexion: 26 }),
      j("leftLowerLeg", { flexion: 46 }),
      j("rightLowerLeg", { flexion: 46 }),
      j("leftUpperArm", { abduction: 50, flexion: 38 }),
      j("rightUpperArm", { abduction: 50, flexion: 38 }),
    ],
    root(0, -0.12, 0, 0),
  );
  const apex: IAutoMoviePose = pose(
    sk,
    [
      j("leftUpperLeg", { flexion: 12 }),
      j("rightUpperLeg", { flexion: 12 }),
      j("leftLowerLeg", { flexion: 22 }),
      j("rightLowerLeg", { flexion: 22 }),
      j("leftUpperArm", { abduction: 210 }),
      j("rightUpperArm", { abduction: 210 }),
    ],
    root(0, 0.26, 0, 0),
  );
  return {
    id: "hop",
    skeleton: sk,
    duration: 1.0,
    loop: true,
    keyframes: [
      key(0, stand),
      key(0.22, crouch),
      key(0.5, apex),
      key(0.8, crouch),
      key(1.0, stand),
    ],
  };
};
