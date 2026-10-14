import type { IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";

import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";

/**
 * Authored one-second right-leg kick loop with stand/windup/strike/windup/stand keys. Signed degree inputs and balancing arms are interpreted by the page's humanoid mapping; the strike is choreography rather than measured kick height, opponent contact or clinical capacity.
 *
 * @evidence contracts/common.md#principled-implementation Three explicit poses and fixed five-frame timing preserve the named single-leg action and match the initial/final stand values.
 * @evidence contracts/common.md#clear-and-simple-design Stand/windup/strike vocabulary supplies the existing clip without owning a contact solver, force model or playback clock.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed joint targets are not validated ROM or a physical impact, and no hidden anatomical default fills missing observations.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies side, sequence, signed degree provenance and unmeasured contact/capacity limits.
 * @evidence contracts/performance.md#efficient-algorithms Three bounded pose arrays and five frame wrappers give constant construction; actual interpolation/FK and scene drawing retain their costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Stand and windup records are reused for return frames within the clip; each call creates fresh vocabulary with no shared mutable output cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-owned frames share local pose records, which consumers preserve across the return cycle; the producer acquires no task or external handle.
 *
 * @author Samchon
 */
export const kick: (sk: string) => IAutoMovieMotion = (
  sk: string,
): IAutoMovieMotion => {
  const stand: IAutoMoviePose = pose(sk, [
    j("leftUpperArm", { abduction: 30 }),
    j("rightUpperArm", { abduction: 30 }),
  ]);
  const windup: IAutoMoviePose = pose(sk, [
    j("rightUpperLeg", { flexion: 25 }),
    j("rightLowerLeg", { flexion: 32 }),
    j("spine", { flexion: -8 }),
    j("leftUpperArm", { abduction: 40, flexion: 22 }),
    j("rightUpperArm", { abduction: 40, flexion: 22 }),
  ]);
  const strike: IAutoMoviePose = pose(sk, [
    j("rightUpperLeg", { flexion: -88 }),
    j("rightLowerLeg", { flexion: 6 }),
    j("leftLowerLeg", { flexion: 6 }),
    j("spine", { flexion: -14 }),
    j("leftUpperArm", { abduction: 45, flexion: 38 }),
    j("rightUpperArm", { abduction: 45, flexion: 38 }),
  ]);
  return {
    id: "kick",
    skeleton: sk,
    duration: 1.0,
    loop: true,
    keyframes: [
      key(0, stand),
      key(0.25, windup),
      key(0.5, strike),
      key(0.72, windup),
      key(1.0, stand),
    ],
  };
};
