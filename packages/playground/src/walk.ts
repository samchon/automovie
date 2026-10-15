import type {
  IAutoMovieJointPose,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";

import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";

/**
 * Authored one-second in-place walking loop with five quarter-second keys alternating contact and passing poses. Angles are conventional degree inputs under the page's humanoid mapping, and absent roots imply no baked travel. Named contact poses are choreography labels rather than measured foot-ground contact or validated gait physiology.
 *
 * @evidence contracts/common.md#principled-implementation Left/right contact and passing factories explicitly state both arms in every frame, and the final left-contact values match the initial cycle values.
 * @evidence contracts/common.md#clear-and-simple-design Small contact/passing/arm vocabulary supplies one sparse clip, keeping speed/travel baking, playback and contact simulation outside this producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed stride angles and labels supply no population-fit, ground force, foot-slip or ROM proof; the receiving rig and optional clamp remain caller/player premises.
 * @evidence contracts/common.md#meaningful-documentation The comment states duration, five-frame order, in-place root absence and the limits of gait labels.
 * @evidence contracts/performance.md#efficient-algorithms Five bounded poses/keys require constant construction; consumer motion sampling/FK and any rendered model complexity retain their separate costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Factories consistently share the authored phase formulas within this call, while fresh mutable pose/joint arrays avoid a hidden cross-call cache. Travel wrappers reuse the resulting base clip during baking.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned clip owns local frame/pose records and acquires no timer, player, worker or GPU object; page and travel consumers own any longer-lived clips/playback.
 *
 * @author Samchon
 */
export const walk: (sk: string) => IAutoMovieMotion = (
  sk: string,
): IAutoMovieMotion => {
  // Arms hang down-and-out (abduction) and swing fore/aft via `flexion` (the
  // anatomical sagittal axis under HUMANOID_JOINT_AXES); `s` is the swing phase
  // in [−1, 1] (+1 = left arm back, right arm forward, opposing the legs).
  // HUMANOID_REST_FRAME recovers the mirrored rig signs at render time.
  // Specified in EVERY keyframe so they swing smoothly instead of snapping back
  // to the rest T-pose.
  const arms: (s: number) => IAutoMovieJointPose[] = (
    s: number,
  ): IAutoMovieJointPose[] => [
    j("leftUpperArm", { abduction: 32, flexion: 30 * s }),
    j("rightUpperArm", { abduction: 32, flexion: 30 * s }),
  ];
  // contact: `lead` leg forward (flexion +), `trail` leg back (flexion −).
  const contact: (lead: "left" | "right") => IAutoMoviePose = (
    lead: "left" | "right",
  ): IAutoMoviePose => {
    const s: number = lead === "left" ? 1 : -1;
    return pose(sk, [
      j("leftUpperLeg", { flexion: 30 * s }),
      j("rightUpperLeg", { flexion: -30 * s }),
      j("leftLowerLeg", { flexion: lead === "left" ? 6 : 34 }),
      j("rightLowerLeg", { flexion: lead === "left" ? 34 : 6 }),
      ...arms(s),
    ]);
  };
  // passing: the swinging leg lifts (knee up) as it crosses under the body.
  const passing: (swing: "left" | "right") => IAutoMoviePose = (
    swing: "left" | "right",
  ): IAutoMoviePose =>
    pose(sk, [
      j("leftUpperLeg", { flexion: swing === "left" ? 16 : 2 }),
      j("rightUpperLeg", { flexion: swing === "right" ? 16 : 2 }),
      j("leftLowerLeg", { flexion: swing === "left" ? 52 : 8 }),
      j("rightLowerLeg", { flexion: swing === "right" ? 52 : 8 }),
      ...arms(0),
    ]);
  return {
    id: "walk",
    skeleton: sk,
    duration: 1.0,
    loop: true,
    keyframes: [
      key(0, contact("left")),
      key(0.25, passing("right")),
      key(0.5, contact("right")),
      key(0.75, passing("left")),
      key(1.0, contact("left")),
    ],
  };
};
