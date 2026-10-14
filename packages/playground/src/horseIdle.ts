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

import { createHorseMotionTail as tail } from "./createHorseMotionTail";
import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";

/**
 * Return a 2.4-second looping three-key idle with tail sway -1/+1/-1, neck flexion 4/8/4 degrees and head flexion -6/-10/-6 degrees. Seconds, metre translations and degree joint angles are authored demo data. The existing horse page consumes these clips in raw quadruped rig space: humanoid arm slots are front legs and little-finger slots are the tail.
 *
 * @evidence contracts/common.md#principled-implementation The existing literal motion AST or canonical engine profile/sequence/travel operation preserves the authored timing, skeleton identity and transform vocabulary.
 * @evidence contracts/common.md#clear-and-simple-design One named clip producer serves the existing horse selector; FK, interpolation, optional ROM clamping, GPU upload and camera behavior remain downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No species measurement, clinical ROM, floor-contact admission, continuous skin or observed model health is certified by producing a motion. The stated angles/speeds are authored conventional values.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual units, consumer, ownership and unverified boundaries of this declaration.
 * @evidence contracts/performance.md#efficient-algorithms Three poses with three tail channels plus neck/head are fixed-size allocations; rendering and interpolation run downstream.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh calls retain independently mutable motion documents rather than a hidden cross-call cache; within-clip references and canonical shared profile rows keep their existing aliasing. Consumers must not mutate module-owned profile rows.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns generated clip data for its actor/page lifetime; the producer acquires no GPU handle, worker, event listener or timer and retains no caller skeleton after return.
 *
 * @author Samchon
 */
export const horseIdle: (sk: string) => IAutoMovieMotion = (
  sk: string,
): IAutoMovieMotion => ({
  id: "idle",
  skeleton: sk,
  duration: 2.4,
  loop: true,
  keyframes: [
    key(
      0,
      pose(sk, [
        ...tail(-1),
        j("neck", { flexion: 4 }),
        j("head", { flexion: -6 }),
      ]),
    ),
    key(
      1.2,
      pose(sk, [
        ...tail(1),
        j("neck", { flexion: 8 }),
        j("head", { flexion: -10 }),
      ]),
    ),
    key(
      2.4,
      pose(sk, [
        ...tail(-1),
        j("neck", { flexion: 4 }),
        j("head", { flexion: -6 }),
      ]),
    ),
  ],
});
