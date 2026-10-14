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

import { createHorseGallopBurst as gallopBurst } from "./createHorseGallopBurst";
import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { horseIdle } from "./horseIdle";
import { horseRear } from "./horseRear";
import { horseTrot } from "./horseTrot";
import { horseTurn } from "./horseTurn";
import { horseWalk } from "./horseWalk";

/**
 * Sequence the existing twenty-one-part looping mounted demo: idle, walks, trots, seven two-gallop bursts, two handwritten rears, one turn and final idle. Mounted rider attachment and its observed safety remain caller/viewer concerns. Seconds, metre translations and degree joint angles are authored demo data. The existing horse page consumes these clips in raw quadruped rig space: humanoid arm slots are front legs and little-finger slots are the tail.
 *
 * @evidence contracts/common.md#principled-implementation The existing literal motion AST or canonical engine profile/sequence/travel operation preserves the authored timing, skeleton identity and transform vocabulary.
 * @evidence contracts/common.md#clear-and-simple-design One named clip producer serves the existing horse selector; FK, interpolation, optional ROM clamping, GPU upload and camera behavior remain downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No species measurement, clinical ROM, floor-contact admission, continuous skin or observed model health is certified by producing a motion. The stated angles/speeds are authored conventional values.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual units, consumer, ownership and unverified boundaries of this declaration.
 * @evidence contracts/performance.md#efficient-algorithms The twenty-one components include twenty-three locomotion selections, each generating all four profile gaits, followed by nested burst/performance key concatenation; repeated full generation remains an acknowledged cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh calls retain independently mutable motion documents rather than a hidden cross-call cache; within-clip references and canonical shared profile rows keep their existing aliasing. Consumers must not mutate module-owned profile rows.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns generated clip data for its actor/page lifetime; the producer acquires no GPU handle, worker, event listener or timer and retains no caller skeleton after return.
 *
 * @author Samchon
 */
export const horsePerformance: (sk: string) => IAutoMovieMotion = (
  sk: string,
): IAutoMovieMotion =>
  sequenceMotion(
    "performance",
    [
      horseIdle(sk),
      horseWalk(sk),
      horseWalk(sk),
      horseTrot(sk),
      horseTrot(sk),
      horseTrot(sk),
      gallopBurst(sk),
      gallopBurst(sk),
      horseRear(sk),
      gallopBurst(sk),
      gallopBurst(sk),
      horseTurn(sk),
      horseTrot(sk),
      horseTrot(sk),
      gallopBurst(sk),
      horseRear(sk),
      gallopBurst(sk),
      gallopBurst(sk),
      horseTrot(sk),
      horseWalk(sk),
      horseIdle(sk),
    ],
    true,
  );
