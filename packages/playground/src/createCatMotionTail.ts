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

import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { createStickmanMotionRoot as root } from "./createStickmanMotionRoot";

/**
 * Construct three little-finger-named tail joints using sway-dependent abduction and an optional curl degree offset. Sway [-1,1] is an authoring convention, not an enforced clamp, and the slots denote a quadruped tail rather than human digits.
 *
 * @evidence contracts/common.md#principled-implementation Literal records or canonical Quaternion/profile/sequence operations preserve the authored units and closed bone identities.
 * @evidence contracts/common.md#clear-and-simple-design The helper gives existing clip producers one file-owned construction seam without changing page selection or introducing a renderer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored tail/root/gait data is not measured anatomy, a solver result or proof of healthy displayed geometry; no inferred clinical default is introduced.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual units, consumer, ownership and unverified boundaries of this declaration.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar/quaternion or three-joint construction uses bounded local work/storage; engine animation sampling remains a separate cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call creates fresh mutable result records and retains no across-call cache; existing module-owned profile rows remain borrowed and must not be mutated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned data is caller-owned; no native handle, timer, worker or listener is acquired or retained.
 *
 * @author Samchon
 */
export const createCatMotionTail: (
  sway: number,
  curl?: number,
) => IAutoMovieJointPose[] = (
  sway: number,
  curl: number = 0,
): IAutoMovieJointPose[] => [
  j("leftLittleProximal", { abduction: 22 * sway, flexion: -18 + curl }),
  j("leftLittleIntermediate", { abduction: 26 * sway, flexion: -14 + curl }),
  j("leftLittleDistal", { abduction: 30 * sway, flexion: -10 + curl }),
];
