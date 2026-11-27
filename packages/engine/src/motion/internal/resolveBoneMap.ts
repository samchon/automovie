import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieRestFrame,
  IAutoMovieSkeleton,
  IAutoMovieSkeletonTopology,
} from "@automovie/interface";

import { AutoMovieEngineKinematics } from "../../kinematics/AutoMovieEngineKinematics";
import { indexSkeletonTopology } from "../../kinematics/internal/indexSkeletonTopology";
import { resolvePose } from "../../kinematics/internal/resolvePose";

/**
 * Index root-reachable FK results by humanoid bone name using the same clinical
 * axes/rest frames as playback. Caller topology must describe the unchanged
 * skeleton; omission builds it for this call. Rest and pose-root scale are
 * ignored by resolvePose. An optional prepared reader belongs to the current
 * synchronous fit and shares only exact FK computation, never returned map or
 * transform ownership. An optional requested set limits outputs and computed
 * ancestry while every authored joint is still admitted in order.
 */
export const resolveBoneMap: (
  skeleton: IAutoMovieSkeleton,
  pose: IAutoMoviePose,
  topology?: IAutoMovieSkeletonTopology,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  prepared?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
  requested?: ReadonlySet<AutoMovieHumanoidBone>,
) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
  skeleton: IAutoMovieSkeleton,
  pose: IAutoMoviePose,
  topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton),
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  prepared?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
  requested?: ReadonlySet<AutoMovieHumanoidBone>,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
  const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
  for (const bone of resolvePose(
    pose,
    skeleton,
    jointAxes,
    restFrames,
    topology,
    prepared,
    requested,
  ))
    map.set(bone.bone, bone);
  return map;
};
