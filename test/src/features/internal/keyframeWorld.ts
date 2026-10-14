import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Observe one existing keyframe's bone through the production forward-kinematics owner and humanoid tables; this shared observer is not an independent FK oracle. */
export const keyframeWorld: (
  skeleton: IAutoMovieSkeleton,
  motion: IAutoMovieMotion,
  index: number,
  slot: AutoMovieHumanoidBone,
) => IAutoMovieVector3 = (
  skeleton: IAutoMovieSkeleton,
  motion: IAutoMovieMotion,
  index: number,
  slot: AutoMovieHumanoidBone,
): IAutoMovieVector3 =>
  resolvePose(
    motion.keyframes[index]!.pose,
    skeleton,
    HUMANOID_JOINT_AXES,
    HUMANOID_REST_FRAME,
  ).find(
    (b: ReturnType<typeof resolvePose>[number]): boolean => b.bone === slot,
  )!.worldPosition;
