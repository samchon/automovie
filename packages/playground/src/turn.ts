import type { IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";
import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionRoot as root } from "./createStickmanMotionRoot";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";

/**
 * Authored 1.6-second root-yaw loop at -70/+70/-70 degrees about +Y, with fixed arm poses and three keys. Root orientation turns the whole actor in its local frame, not a cervical anatomical measurement or simulated torque.
 *
 * @evidence contracts/common.md#principled-implementation The canonical quaternion constructor turns the root around named +Y while one pose factory preserves the same arm state at each authored instant.
 * @evidence contracts/common.md#clear-and-simple-design One root-orientation vocabulary exposes the turn; the player performs quaternion interpolation and model articulation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Yaw and arm values are authored choreography with no inferred neck capacity, mechanical contact or observed appearance.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies total span, exact yaw endpoints, axis and whole-actor rather than cervical meaning.
 * @evidence contracts/performance.md#efficient-algorithms Three constant-size quaternion/pose/key records bound production, with later motion sampling/FK and draw work retained by consumers.
 * @evidence contracts/performance.md#reuse-equivalent-work The pose factory uses one authored arm recipe for all yaw samples; each call creates independent transforms and keeps no result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the resulting clip and fresh transform records; no loop, timer, worker or renderer is started here.
 *
 * @author Samchon
 */
export const turn: (sk: string) => IAutoMovieMotion = (sk: string): IAutoMovieMotion => {
  const at: (yaw: number) => IAutoMoviePose = (yaw: number): IAutoMoviePose =>
    pose(
      sk,
      [
        j("leftUpperArm", { abduction: 125 }),
        j("rightUpperArm", { abduction: 125 }),
      ],
      root(0, 0, 0, yaw),
    );
  return {
    id: "turn",
    skeleton: sk,
    duration: 1.6,
    loop: true,
    keyframes: [key(0, at(-70)), key(0.8, at(70)), key(1.6, at(-70))],
  };
};
