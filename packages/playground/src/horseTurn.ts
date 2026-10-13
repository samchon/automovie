import { Quaternion, bindProfileGaits, sequenceMotion, travelMotion } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieKeyframe, IAutoMovieMotion, IAutoMoviePose, IAutoMovieTransform } from "@automovie/interface";
import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { HORSE_PROFILE } from "@automovie/archetypes";
import { createHorseMotionTail as tail } from "./createHorseMotionTail";
import { createHorseMotionRootYaw as rootYaw } from "./createHorseMotionRootYaw";

/**
 * Return a 2.2-second looping five-key alternating prance, with +Y root yaw -28/-8/0/24/-28 degrees and root Y +0.02 metres. Head twist and tail sway follow the existing yaw-sign branch. Seconds, metre translations and degree joint angles are authored demo data. The existing horse page consumes these clips in raw quadruped rig space: humanoid arm slots are front legs and little-finger slots are the tail.
 *
 * @evidence contracts/common.md#principled-implementation The existing literal motion AST or canonical engine profile/sequence/travel operation preserves the authored timing, skeleton identity and transform vocabulary.
 * @evidence contracts/common.md#clear-and-simple-design One named clip producer serves the existing horse selector; FK, interpolation, optional ROM clamping, GPU upload and camera behavior remain downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No species measurement, clinical ROM, floor-contact admission, continuous skin or observed model health is certified by producing a motion. The stated angles/speeds are authored conventional values.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual units, consumer, ownership and unverified boundaries of this declaration.
 * @evidence contracts/performance.md#efficient-algorithms Five fixed-population poses/keyframes bound construction, independently of downstream frame sampling.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh calls retain independently mutable motion documents rather than a hidden cross-call cache; within-clip references and canonical shared profile rows keep their existing aliasing. Consumers must not mutate module-owned profile rows.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns generated clip data for its actor/page lifetime; the producer acquires no GPU handle, worker, event listener or timer and retains no caller skeleton after return.
 *
 * @author Samchon
 */
export const horseTurn: (sk: string) => IAutoMovieMotion = (sk: string): IAutoMovieMotion => {
  const prance: (yaw: number, lift: "left" | "right") => IAutoMoviePose = (yaw: number, lift: "left" | "right"): IAutoMoviePose =>
    pose(
      sk,
      [
        j("leftUpperArm", { flexion: lift === "left" ? -40 : -8 }),
        j("leftLowerArm", { flexion: lift === "left" ? 70 : 20 }),
        j("rightUpperArm", { flexion: lift === "right" ? -40 : -8 }),
        j("rightLowerArm", { flexion: lift === "right" ? 70 : 20 }),
        j("leftUpperLeg", { flexion: 8 }),
        j("rightUpperLeg", { flexion: 8 }),
        j("neck", { flexion: -8 }),
        j("head", { flexion: -10, twist: yaw > 0 ? 16 : -16 }),
        ...tail(yaw > 0 ? 0.8 : -0.8),
      ],
      rootYaw(0.02, yaw),
    );
  return {
    id: "turn",
    skeleton: sk,
    duration: 2.2,
    loop: true,
    keyframes: [
      key(0, prance(-28, "left")),
      key(0.55, prance(-8, "right")),
      key(1.1, prance(0, "left")),
      key(1.65, prance(24, "right")),
      key(2.2, prance(-28, "left")),
    ],
  };
};
