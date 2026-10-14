import { HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME, resolvePose, sampleMotion } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieMotion, IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";

/** Observe the original requested bone through production motion sampling/FK with humanoid clinical tables. The caller owns the present/reachable-bone premise; this shared product observer is not an independent geometry oracle. */
export function retargetHumanoidWorld(skeleton: IAutoMovieSkeleton, motion: IAutoMovieMotion, time: number, boneName: AutoMovieHumanoidBone): IAutoMovieVector3 {
  return resolvePose(
    sampleMotion(motion, time).pose,
    skeleton,
    HUMANOID_JOINT_AXES,
    HUMANOID_REST_FRAME,
  ).find((b: ReturnType<typeof resolvePose>[number]): boolean => b.bone === boneName)!.worldPosition;
}
