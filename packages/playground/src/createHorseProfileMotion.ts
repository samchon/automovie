import { Quaternion, bindProfileGaits, sequenceMotion, travelMotion } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieKeyframe, IAutoMovieMotion, IAutoMoviePose, IAutoMovieTransform } from "@automovie/interface";
import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { HORSE_PROFILE } from "@automovie/archetypes";

/**
 * Bind the entire HORSE_PROFILE at twenty-four samples and select one existing walk/trot/gallop row. The four gait names are a fixed catalogue premise; malformed or mutated shared profile data is not repaired by the non-null assertion.
 *
 * @evidence contracts/common.md#principled-implementation Literal records or canonical Quaternion/profile/sequence operations preserve the authored units and closed bone identities.
 * @evidence contracts/common.md#clear-and-simple-design The helper gives existing clip producers one file-owned construction seam without changing page selection or introducing a renderer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored tail/root/gait data is not measured anatomy, a solver result or proof of healthy displayed geometry; no inferred clinical default is introduced.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual units, consumer, ownership and unverified boundaries of this declaration.
 * @evidence contracts/performance.md#efficient-algorithms All four gaits are validated and sampled; cost scales with their combined channels and samples even though only one motion is returned.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call creates fresh mutable result records and retains no across-call cache; existing module-owned profile rows remain borrowed and must not be mutated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned data is caller-owned; no native handle, timer, worker or listener is acquired or retained.
 *
 * @author Samchon
 */
export const createHorseProfileMotion: (sk: string, name: "walk" | "trot" | "gallop") => IAutoMovieMotion = (
  sk: string,
  name: "walk" | "trot" | "gallop",
): IAutoMovieMotion => bindProfileGaits(HORSE_PROFILE, sk, 24)[name]!;
