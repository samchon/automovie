import { CAT_PROFILE } from "@automovie/archetypes";
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

import { createCatMotionTail as tail } from "./createCatMotionTail";
import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { createStickmanMotionRoot as root } from "./createStickmanMotionRoot";

/**
 * Return a 1.8-second looping neutral/bow/neutral clip, with bow at 0.8 seconds: front upper legs -42 degrees, spine/chest 38/26 degrees, neck -30 degrees and root Y +0.03 metres. Seconds, metre translations and degree joint angles are authored demo data. The existing cat page consumes these clips in raw quadruped rig space: humanoid arm slots are front legs and little-finger slots are the tail.
 *
 * @evidence contracts/common.md#principled-implementation The existing literal motion AST or canonical engine profile/sequence/travel operation preserves the authored timing, skeleton identity and transform vocabulary.
 * @evidence contracts/common.md#clear-and-simple-design One named clip producer serves the existing cat selector; FK, interpolation, optional ROM clamping, GPU upload and camera behavior remain downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No species measurement, clinical ROM, floor-contact admission, continuous skin or observed model health is certified by producing a motion. The stated angles/speeds are authored conventional values.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual units, consumer, ownership and unverified boundaries of this declaration.
 * @evidence contracts/performance.md#efficient-algorithms Two authored pose objects populate three keys; neutral is reused within this clip without an across-call cache.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh calls retain independently mutable motion documents rather than a hidden cross-call cache; within-clip references and canonical shared profile rows keep their existing aliasing. Consumers must not mutate module-owned profile rows.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns generated clip data for its actor/page lifetime; the producer acquires no GPU handle, worker, event listener or timer and retains no caller skeleton after return.
 *
 * @author Samchon
 */
export const catStretch: (sk: string) => IAutoMovieMotion = (
  sk: string,
): IAutoMovieMotion => {
  const neutral: IAutoMoviePose = pose(sk, [...tail(0)]);
  const bow: IAutoMoviePose = pose(
    sk,
    [
      // Front legs reach forward, chest drops to the floor.
      j("leftUpperArm", { flexion: -42 }),
      j("rightUpperArm", { flexion: -42 }),
      j("spine", { flexion: 38 }),
      j("chest", { flexion: 26 }),
      j("neck", { flexion: -30 }),
      // Hind legs stay straight with the rump raised.
      j("leftUpperLeg", { flexion: -10 }),
      j("rightUpperLeg", { flexion: -10 }),
      ...tail(0, -26),
    ],
    root(0, 0.03, 0, 0),
  );
  return {
    id: "stretch",
    skeleton: sk,
    duration: 1.8,
    loop: true,
    keyframes: [key(0, neutral), key(0.8, bow), key(1.8, neutral)],
  };
};
