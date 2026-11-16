import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  type preparePoseResolution,
  resolveBoneMap,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

/**
 * Every bone of a canonical pose placed in the world, by name: forward
 * kinematics with the canonical joint axes and rest frames, the reading the
 * performance and the capture use, so a law that reads a pose it resolved
 * itself (where a hand hangs, where a thigh lies) sees what is displayed.
 *
 * The body's topology must index its same, unchanged skeleton, as prepared
 * by `createHumanBody`. Every pose still receives full ordered admission and
 * the complete hierarchy walk. A supplied operation reader shares only
 * exactly unchanged computation and returns fresh maps and transforms.
 *
 * @param body The body and its topology for the same, unchanged skeleton.
 * @param pose The pose.
 * @param prepared Optional exact FK reader owned and released by this synchronous motion evaluation.
 * @returns Resolved bones by rig bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the displayed reading, canonical mappings and the body's unchanged-skeleton topology premise.
 * @evidence contracts/development/implementation.md#principled-implementation The engine's complete forward kinematics with the canonical humanoid axes and rest frames, using the same parent-first topology createHumanBody prepared from the body's unchanged skeleton.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolveBoneMap call supplies canonical mappings and the body's topology; hierarchy, composition and map adaptation remain with their existing engine owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No cast, assertion or tolerance; the axes and rest frames are the engine's canonical tables.
 * @evidence contracts/development/implementation.md#efficient-algorithms Ordered joint/bone scans and direct map insertion remain O(J+B), without this adapter's former tuple array. An optional operation reader avoids only identical completed math; canonical topology is not rebuilt and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body topology belongs to its unchanged skeleton; an optional reader shares exact clinical/basis/frame/rest/parent computation within one caller-owned synchronous motion evaluation, including entry, carry, limb, digit, held or stop work, without merging poses or admitting stale topology.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns a fresh map and nested bone transforms; a borrowed resolution reader keeps its private snapshots only until the synchronous motion evaluation releases it. This adapter stores no global state or handle.
 */
export function poseBones(
  body: IHumanBody,
  pose: IAutoMoviePose,
  prepared?: ReturnType<typeof preparePoseResolution>,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  return resolveBoneMap(
    body.skeleton,
    pose,
    body.topology,
    HUMANOID_JOINT_AXES,
    HUMANOID_REST_FRAME,
    prepared,
  );
}
