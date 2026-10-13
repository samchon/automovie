import { Quaternion, bindProfileGaits, sequenceMotion, travelMotion } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieKeyframe, IAutoMovieMotion, IAutoMoviePose, IAutoMovieTransform } from "@automovie/interface";
import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { CAT_PROFILE } from "@automovie/archetypes";
import { createStickmanMotionRoot as root } from "./createStickmanMotionRoot";
import { createCatMotionTail as tail } from "./createCatMotionTail";

/**
 * Return a 0.7-second looping three-key tail sway -1/+1/-1 with head twist 18 times sway degrees and no root displacement. Seconds, metre translations and degree joint angles are authored demo data. The existing cat page consumes these clips in raw quadruped rig space: humanoid arm slots are front legs and little-finger slots are the tail.
 *
 * @evidence contracts/common.md#principled-implementation The existing literal motion AST or canonical engine profile/sequence/travel operation preserves the authored timing, skeleton identity and transform vocabulary.
 * @evidence contracts/common.md#clear-and-simple-design One named clip producer serves the existing cat selector; FK, interpolation, optional ROM clamping, GPU upload and camera behavior remain downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No species measurement, clinical ROM, floor-contact admission, continuous skin or observed model health is certified by producing a motion. The stated angles/speeds are authored conventional values.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual units, consumer, ownership and unverified boundaries of this declaration.
 * @evidence contracts/performance.md#efficient-algorithms Three poses each contain the three fixed tail channels and one head channel; construction is bounded independently of playback frames.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh calls retain independently mutable motion documents rather than a hidden cross-call cache; within-clip references and canonical shared profile rows keep their existing aliasing. Consumers must not mutate module-owned profile rows.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns generated clip data for its actor/page lifetime; the producer acquires no GPU handle, worker, event listener or timer and retains no caller skeleton after return.
 *
 * @author Samchon
 */
export const catTailFlick: (sk: string) => IAutoMovieMotion = (sk: string): IAutoMovieMotion => {
  const flick: (sway: number) => IAutoMoviePose = (sway: number): IAutoMoviePose =>
    pose(sk, [...tail(sway), j("head", { twist: 18 * sway })]);
  return {
    id: "tailFlick",
    skeleton: sk,
    duration: 0.7,
    loop: true,
    keyframes: [key(0, flick(-1)), key(0.35, flick(1)), key(0.7, flick(-1))],
  };
};
