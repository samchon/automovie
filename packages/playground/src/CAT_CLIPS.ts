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

import { catBound } from "./catBound";
import { catCombo } from "./catCombo";
import { catIdle } from "./catIdle";
import { catLeap } from "./catLeap";
import { catProwl } from "./catProwl";
import { catSit } from "./catSit";
import { catStalk } from "./catStalk";
import { catStretch } from "./catStretch";
import { catTailFlick } from "./catTailFlick";
import { catWalk } from "./catWalk";
import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { createStickmanMotionRoot as root } from "./createStickmanMotionRoot";

/**
 * Eagerly construct ten named cat motions for the existing page selector: idle, walk, leap, stalk, sit, stretch, tailFlick, combo, prowl and bound. Seconds, metre translations and degree joint angles are authored demo data. The existing cat page consumes these clips in raw quadruped rig space: humanoid arm slots are front legs and little-finger slots are the tail.
 *
 * @evidence contracts/common.md#principled-implementation The existing literal motion AST or canonical engine profile/sequence/travel operation preserves the authored timing, skeleton identity and transform vocabulary.
 * @evidence contracts/common.md#clear-and-simple-design One named clip producer serves the existing cat selector; FK, interpolation, optional ROM clamping, GPU upload and camera behavior remain downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No species measurement, clinical ROM, floor-contact admission, continuous skin or observed model health is certified by producing a motion. The stated angles/speeds are authored conventional values.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual units, consumer, ownership and unverified boundaries of this declaration.
 * @evidence contracts/performance.md#efficient-algorithms The complete catalogue constructs every motion, including eight complete three-gait profile bindings plus sequence/travel key expansion; changing a page selection does not avoid catalogue startup cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh calls retain independently mutable motion documents rather than a hidden cross-call cache; within-clip references and canonical shared profile rows keep their existing aliasing. Consumers must not mutate module-owned profile rows.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns generated clip data for its actor/page lifetime; the producer acquires no GPU handle, worker, event listener or timer and retains no caller skeleton after return.
 *
 * @author Samchon
 */
export const CAT_CLIPS: (sk: string) => Record<string, IAutoMovieMotion> = (
  sk: string,
): Record<string, IAutoMovieMotion> => ({
  idle: catIdle(sk),
  walk: catWalk(sk),
  leap: catLeap(sk),
  stalk: catStalk(sk),
  sit: catSit(sk),
  stretch: catStretch(sk),
  tailFlick: catTailFlick(sk),
  combo: catCombo(sk),
  prowl: catProwl(sk),
  bound: catBound(sk),
});
