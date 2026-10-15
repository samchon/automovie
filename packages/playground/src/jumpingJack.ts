import type { IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";

import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";

/**
 * Authored one-second in-place jumping-jack loop with three frames: closed, open and closed. Joint angles are degrees interpreted by the page's humanoid axes/rest-frame mapping. The open pose retains the existing 185-degree upper-arm abduction; optional page clamping may change it, and this producer proves neither clinical capacity nor observed motion health.
 *
 * @evidence contracts/common.md#principled-implementation Two explicit pose records define a value-closed cycle with exact 0/0.5/1-second instants and outgoing easeInOut interpolation; the full named skeleton is supplied by the caller.
 * @evidence contracts/common.md#clear-and-simple-design A fixed three-frame producer exposes the current demonstration without owning playback, constraints or a second movement solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 185-degree legacy overshoot is an authored display value, not a clinical observation or locally admitted shoulder range; no contact/ROM validation occurs here.
 * @evidence contracts/common.md#meaningful-documentation The comment gives duration/frame order, degree/rest-frame interpretation and the retained overshoot/clamp limitation.
 * @evidence contracts/performance.md#efficient-algorithms Two bounded joint arrays and three frame wrappers require constant construction work; model FK, sampling and renderer work still occur in their ordinary consumers.
 * @evidence contracts/performance.md#reuse-equivalent-work First and last frames borrow the same closed pose in this call; each invocation creates a fresh clip/vocabulary rather than sharing mutable output across different callers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-owned clip wrappers retain their local pose arrays; shared endpoint pose records must not be independently mutated through one frame. No timer, player, worker or GPU handle is acquired.
 *
 * @author Samchon
 */
export const jumpingJack: (sk: string) => IAutoMovieMotion = (
  sk: string,
): IAutoMovieMotion => {
  const closed: IAutoMoviePose = pose(sk, [
    j("leftUpperArm", { abduction: 18 }),
    j("rightUpperArm", { abduction: 18 }),
  ]);
  const open: IAutoMoviePose = pose(sk, [
    j("leftUpperArm", { abduction: 185 }),
    j("rightUpperArm", { abduction: 185 }),
    j("leftUpperLeg", { abduction: 18 }),
    j("rightUpperLeg", { abduction: 18 }),
  ]);
  return {
    id: "jumpingJack",
    skeleton: sk,
    duration: 1.0,
    loop: true,
    keyframes: [key(0, closed), key(0.5, open), key(1.0, closed)],
  };
};
