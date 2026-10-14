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

import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { horseGallop } from "./horseGallop";

/**
 * Sequence two freshly generated gallops into one non-looping burst for the existing mounted performance; complete profile binding occurs independently for each gallop.
 *
 * @evidence contracts/common.md#principled-implementation Literal records or canonical Quaternion/profile/sequence operations preserve the authored units and closed bone identities.
 * @evidence contracts/common.md#clear-and-simple-design The helper gives existing clip producers one file-owned construction seam without changing page selection or introducing a renderer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored tail/root/gait data is not measured anatomy, a solver result or proof of healthy displayed geometry; no inferred clinical default is introduced.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual units, consumer, ownership and unverified boundaries of this declaration.
 * @evidence contracts/performance.md#efficient-algorithms Two complete four-gait bindings precede sequence key expansion; discarded profile motions still incur allocation work.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call creates fresh mutable result records and retains no across-call cache; existing module-owned profile rows remain borrowed and must not be mutated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned data is caller-owned; no native handle, timer, worker or listener is acquired or retained.
 *
 * @author Samchon
 */
export const createHorseGallopBurst: (sk: string) => IAutoMovieMotion = (
  sk: string,
): IAutoMovieMotion =>
  sequenceMotion("burst", [horseGallop(sk), horseGallop(sk)], false);
