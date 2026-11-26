import {
  AutoMovieHumanoidBone,
  IAutoMovieSkeleton,
  type IAutoMovieSkeletonTopology,
} from "@automovie/interface";

import { reachableBoneNames } from "../kinematics";

/**
 * Return reachableBoneNames' fresh copy of root-reachable bone names, using a
 * supplied unchanged-skeleton topology or building one.
 */
export function fkReachableBones(
  skeleton: IAutoMovieSkeleton,
  topology?: IAutoMovieSkeletonTopology,
): Set<AutoMovieHumanoidBone> {
  return reachableBoneNames(skeleton, topology);
}
