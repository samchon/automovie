import {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { IAutoMovieSkeletonTopology } from "../kinematics/IAutoMovieSkeletonTopology";
import { indexSkeletonTopology } from "../kinematics/indexSkeletonTopology";
import { resolvePose } from "../kinematics/resolvePose";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";

/**
 * Index root-reachable FK results by humanoid bone name using the same clinical axes/rest frames as playback. Caller topology must describe the unchanged skeleton; omission builds it for this call. Rest and pose-root scale are ignored by resolvePose.
 *
 * @evidence contracts/common.md#principled-implementation Delegates parent-first FK to resolvePose and creates a name map over its reachable results, preserving its omitted-cycle/detached-bone and later-duplicate-joint semantics.
 * @evidence contracts/common.md#clear-and-simple-design The map adapter supplies constant-time bone lookup to contact passes without duplicating the hierarchy or clinical quaternion rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No detached bone is reattached or fake transform inserted; map membership follows the FK owner exactly, and supplied semantic tables are used without consumer-specific overrides.
 * @evidence contracts/common.md#meaningful-documentation States reachable membership, optional topology/mapping premises and the no-scale FK frame used by planting and retargeting.
 * @evidence contracts/performance.md#efficient-algorithms FK is linear in joints plus reachable bones, followed by one O(B) map build; topology construction adds O(total bones) only when omitted.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses caller-supplied topology for repeated poses of the same unchanged skeleton; the resolved pose itself changes per frame and is not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a caller-owned map referencing fresh resolved bone records; the intermediate tuple/result arrays are temporary and no input rig or resource handle is retained.
 */
export const resolveBoneMap: (
  skeleton: IAutoMovieSkeleton,
  pose: IAutoMoviePose,
  topology?: IAutoMovieSkeletonTopology,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
  skeleton: IAutoMovieSkeleton,
  pose: IAutoMoviePose,
  topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton),
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
  new Map(
    resolvePose(pose, skeleton, jointAxes, restFrames, topology).map(
      (
        bone: IAutoMovieResolvedBone,
      ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [bone.bone, bone],
    ),
  );
