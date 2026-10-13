import { Quaternion, bindProfileGaits, sequenceMotion, travelMotion } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieKeyframe, IAutoMovieMotion, IAutoMoviePose, IAutoMovieTransform } from "@automovie/interface";
import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { CAT_PROFILE } from "@automovie/archetypes";
import { createStickmanMotionRoot as root } from "./createStickmanMotionRoot";
import { createCatProfileMotion as profileClip } from "./createCatProfileMotion";

/**
 * Select the authored one-second CAT_PROFILE leap with symmetric front/hind degree channels and metre root bob, sampled twenty-four times for the caller's skeleton name. Seconds, metre translations and degree joint angles are authored demo data. The existing cat page consumes these clips in raw quadruped rig space: humanoid arm slots are front legs and little-finger slots are the tail.
 *
 * @evidence contracts/common.md#principled-implementation The existing literal motion AST or canonical engine profile/sequence/travel operation preserves the authored timing, skeleton identity and transform vocabulary.
 * @evidence contracts/common.md#clear-and-simple-design One named clip producer serves the existing cat selector; FK, interpolation, optional ROM clamping, GPU upload and camera behavior remain downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No species measurement, clinical ROM, floor-contact admission, continuous skin or observed model health is certified by producing a motion. The stated angles/speeds are authored conventional values.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual units, consumer, ownership and unverified boundaries of this declaration.
 * @evidence contracts/performance.md#efficient-algorithms All three profile gaits are validated and sampled before selecting leap; their full limb/sample allocation cost remains.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh calls retain independently mutable motion documents rather than a hidden cross-call cache; within-clip references and canonical shared profile rows keep their existing aliasing. Consumers must not mutate module-owned profile rows.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns generated clip data for its actor/page lifetime; the producer acquires no GPU handle, worker, event listener or timer and retains no caller skeleton after return.
 *
 * @author Samchon
 */
export const catLeap: (sk: string) => IAutoMovieMotion = (sk: string): IAutoMovieMotion =>
  profileClip(sk, "leap");
