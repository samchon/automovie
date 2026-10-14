import { HORSE_PROFILE } from "@automovie/archetypes";
import {
  Quaternion,
  bindProfileGaits,
  sequenceMotion,
  travelMotion,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieTransform,
} from "@automovie/interface";

import { createHorseMotionRoot as root } from "./createHorseMotionRoot";
import { createHorseMotionTail as tail } from "./createHorseMotionTail";
import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";

/**
 * Return the existing 2.6-second non-looping eight-key stand/coil/rear/toss/recover sequence. Rear root Y is +0.06 metres and pitch is -0.5 degrees about +X, while spine/chest/neck use -46/-28/-52 degrees; the root value is not radians or a verified physical balance. Seconds, metre translations and degree joint angles are authored demo data. The existing horse page consumes these clips in raw quadruped rig space: humanoid arm slots are front legs and little-finger slots are the tail.
 *
 * @evidence contracts/common.md#principled-implementation The existing literal motion AST or canonical engine profile/sequence/travel operation preserves the authored timing, skeleton identity and transform vocabulary.
 * @evidence contracts/common.md#clear-and-simple-design One named clip producer serves the existing horse selector; FK, interpolation, optional ROM clamping, GPU upload and camera behavior remain downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No species measurement, clinical ROM, floor-contact admission, continuous skin or observed model health is certified by producing a motion. The stated angles/speeds are authored conventional values.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual units, consumer, ownership and unverified boundaries of this declaration.
 * @evidence contracts/performance.md#efficient-algorithms Eight keys refer to bounded stand/coil/toss pose objects; no balance, contact, muscle or dynamic-body solver runs here.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh calls retain independently mutable motion documents rather than a hidden cross-call cache; within-clip references and canonical shared profile rows keep their existing aliasing. Consumers must not mutate module-owned profile rows.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns generated clip data for its actor/page lifetime; the producer acquires no GPU handle, worker, event listener or timer and retains no caller skeleton after return.
 *
 * @author Samchon
 */
export const horseRear: (sk: string) => IAutoMovieMotion = (
  sk: string,
): IAutoMovieMotion => {
  const stand: IAutoMoviePose = pose(
    sk,
    [...tail(-0.5), j("neck", { flexion: 4 })],
    root(0),
  );
  const coil: IAutoMoviePose = pose(
    sk,
    [
      ...tail(0, 6),
      j("leftUpperLeg", { flexion: 18 }),
      j("rightUpperLeg", { flexion: 18 }),
      j("leftLowerLeg", { flexion: 36 }),
      j("rightLowerLeg", { flexion: 36 }),
      j("spine", { flexion: 8 }),
      j("neck", { flexion: 14 }),
      j("head", { flexion: 10 }),
    ],
    root(-0.04),
  );
  const rearUp: (toss: number) => IAutoMoviePose = (
    toss: number,
  ): IAutoMoviePose =>
    pose(
      sk,
      [
        j("leftUpperArm", { flexion: -72, abduction: 8 }),
        j("rightUpperArm", { flexion: -84, abduction: -8 }),
        j("leftLowerArm", { flexion: 96 }),
        j("rightLowerArm", { flexion: 110 }),
        j("leftUpperLeg", { flexion: 6 }),
        j("rightUpperLeg", { flexion: 6 }),
        j("leftLowerLeg", { flexion: 30 }),
        j("rightLowerLeg", { flexion: 30 }),
        j("spine", { flexion: -46 }),
        j("chest", { flexion: -28 }),
        j("neck", { flexion: -52 }),
        j("head", { flexion: -18 + toss }),
        ...tail(0, 18),
      ],
      root(0.06, -0.5),
    );
  return {
    id: "rear",
    skeleton: sk,
    duration: 2.6,
    loop: false,
    keyframes: [
      key(0, stand),
      key(0.4, coil),
      key(0.9, rearUp(0)),
      key(1.25, rearUp(16)),
      key(1.6, rearUp(2)),
      key(1.95, rearUp(14)),
      key(2.3, coil),
      key(2.6, stand),
    ],
  };
};
