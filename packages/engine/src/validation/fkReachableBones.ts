import {
  AutoMovieHumanoidBone,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { IAutoMovieSkeletonTopology, reachableBoneNames } from "../kinematics";

/**
 * Return reachableBoneNames' fresh copy of root-reachable bone names, using a supplied unchanged-skeleton topology or building one.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Return reachableBoneNames' fresh copy of root-reachable bone names, using a supplied unchanged-skeleton topology or building one.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The alias keeps FK reachability with the kinematics owner rather than a second validator traversal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Declared but detached bones stay absent; a supplied topology must match the current skeleton.
 * @evidence contracts/development/common.md#meaningful-documentation The returned set is caller-owned and means reachability rather than numerical transform validity.
 * @evidence contracts/development/implementation.md#efficient-algorithms Copying the reachable set is O(B); omitted topology additionally pays its graph-index construction.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Physics validators reuse one topology for reachability and pose sampling.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the caller-owned set escapes; the alias retains no skeleton or host state.
 */
export const fkReachableBones: (
  skeleton: IAutoMovieSkeleton,
  topology?: IAutoMovieSkeletonTopology,
) => Set<AutoMovieHumanoidBone> = (
  skeleton: IAutoMovieSkeleton,
  topology?: IAutoMovieSkeletonTopology,
): Set<AutoMovieHumanoidBone> => reachableBoneNames(skeleton, topology);
