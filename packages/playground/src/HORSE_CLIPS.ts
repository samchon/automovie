import { Quaternion, bindProfileGaits, sequenceMotion, travelMotion } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieKeyframe, IAutoMovieMotion, IAutoMoviePose, IAutoMovieTransform } from "@automovie/interface";
import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { HORSE_PROFILE } from "@automovie/archetypes";
import { horseIdle } from "./horseIdle";
import { horseWalk } from "./horseWalk";
import { horseTrot } from "./horseTrot";
import { horseGallop } from "./horseGallop";
import { horseGallopTravel } from "./horseGallopTravel";
import { horseRear } from "./horseRear";
import { horseTurn } from "./horseTurn";
import { horsePerformance } from "./horsePerformance";

/**
 * Eagerly construct eight horse motions for the existing selector: idle, walk, trot, gallop, gallopTravel, turn, rear and performance. The handwritten rear is distinct from HORSE_PROFILE's rear row, though profile binding also constructs that unused row. Seconds, metre translations and degree joint angles are authored demo data. The existing horse page consumes these clips in raw quadruped rig space: humanoid arm slots are front legs and little-finger slots are the tail.
 *
 * @evidence contracts/common.md#principled-implementation The existing literal motion AST or canonical engine profile/sequence/travel operation preserves the authored timing, skeleton identity and transform vocabulary.
 * @evidence contracts/common.md#clear-and-simple-design One named clip producer serves the existing horse selector; FK, interpolation, optional ROM clamping, GPU upload and camera behavior remain downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No species measurement, clinical ROM, floor-contact admission, continuous skin or observed model health is certified by producing a motion. The stated angles/speeds are authored conventional values.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual units, consumer, ownership and unverified boundaries of this declaration.
 * @evidence contracts/performance.md#efficient-algorithms All eight motions are built eagerly; twenty-seven full four-gait bindings plus sequence/travel expansion retain their complete startup allocation and work.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh calls retain independently mutable motion documents rather than a hidden cross-call cache; within-clip references and canonical shared profile rows keep their existing aliasing. Consumers must not mutate module-owned profile rows.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns generated clip data for its actor/page lifetime; the producer acquires no GPU handle, worker, event listener or timer and retains no caller skeleton after return.
 *
 * @author Samchon
 */
export const HORSE_CLIPS: (sk: string) => Record<string, IAutoMovieMotion> = (sk: string): Record<string, IAutoMovieMotion> => ({
  idle: horseIdle(sk),
  walk: horseWalk(sk),
  trot: horseTrot(sk),
  gallop: horseGallop(sk),
  gallopTravel: horseGallopTravel(sk),
  turn: horseTurn(sk),
  rear: horseRear(sk),
  performance: horsePerformance(sk),
});
