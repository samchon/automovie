import {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { IAutoMovieSkeletonTopology } from "../kinematics/IAutoMovieSkeletonTopology";
import { indexSkeletonTopology } from "../kinematics/indexSkeletonTopology";
import type { preparePoseResolution } from "../kinematics/preparePoseResolution";
import { resolvePose } from "../kinematics/resolvePose";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";

/**
 * Index root-reachable FK results by humanoid bone name using the same clinical axes/rest frames as playback. Caller topology must describe the unchanged skeleton; omission builds it for this call. Rest and pose-root scale are ignored by resolvePose. An optional prepared reader belongs to the current synchronous fit and shares only exact FK computation, never returned map or transform ownership.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Delegates parent-first FK to resolvePose and creates a name map over its reachable results, preserving its omitted-cycle/detached-bone and later-duplicate-joint semantics.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The map adapter supplies constant-time bone lookup to contact passes without duplicating the hierarchy or clinical quaternion rules.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No detached bone is reattached or fake transform inserted; map membership follows the FK owner exactly, and supplied semantic tables are used without consumer-specific overrides.
 * @evidence contracts/development/common.md#meaningful-documentation States reachable membership, optional topology/mapping premises and the no-scale FK frame used by planting and retargeting.
 * @evidence contracts/development/implementation.md#efficient-algorithms FK keeps linear ordered scans with optional exact computation reuse, followed by one O(B) direct map build without an intermediate entry-tuple array; topology construction adds O(total bones) only when omitted.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Passes caller topology and an optional operation-owned preparePoseResolution reader to the same FK owner. Actual dependency equality, ordered joint admission and fresh transforms are preserved across related source, zeroed and reference poses.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a caller-owned map and fresh resolved bone records. The result array is temporary; the borrowed reader's private snapshots remain with its operation, and no map, handle or global cache is retained here.
 */
export const resolveBoneMap: (
  skeleton: IAutoMovieSkeleton,
  pose: IAutoMoviePose,
  topology?: IAutoMovieSkeletonTopology,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  prepared?: ReturnType<typeof preparePoseResolution>,
) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
  skeleton: IAutoMovieSkeleton,
  pose: IAutoMoviePose,
  topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton),
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  prepared?: ReturnType<typeof preparePoseResolution>,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
  const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
  for (const bone of resolvePose(
    pose,
    skeleton,
    jointAxes,
    restFrames,
    topology,
    prepared,
  ))
    map.set(bone.bone, bone);
  return map;
};
