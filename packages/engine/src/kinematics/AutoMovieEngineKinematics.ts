import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieLookAt,
  IAutoMovieMotionSample,
  IAutoMoviePose,
  IAutoMoviePoseResolution,
  IAutoMovieResolvedBone,
  IAutoMovieRestFrame,
  IAutoMovieSkeleton,
  IAutoMovieSkeletonTopology,
} from "@automovie/interface";

import { resolveLookAt as resolveLookAtImplementation } from "./resolveLookAt";
import { resolvePose as resolvePoseImplementation } from "./resolvePose";

/** Pure forward-kinematics and authored-gaze operations for AutoMovie poses. */
export namespace AutoMovieEngineKinematics {
  /**
   * Forward kinematics: resolve a pose against its skeleton into reachable bone
   * transforms in parent-first order. Optional axes, rest frames, topology,
   * prepared adapter and requested bones keep the existing resolvePose
   * contract.
   */
  export function resolvePose(
    pose: IAutoMoviePose,
    skeleton: IAutoMovieSkeleton,
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
    topology?: IAutoMovieSkeletonTopology,
    prepared?: IAutoMoviePoseResolution,
    requested?: ReadonlySet<string>,
  ): IAutoMovieResolvedBone[] {
    return resolvePoseImplementation(
      pose,
      skeleton,
      jointAxes,
      restFrames,
      topology,
      prepared,
      requested,
    );
  }

  /**
   * Apply a declared bone gaze to a sampled pose. Non-bone or absent gaze, or
   * an expression without gaze channels, returns the input sample itself. A
   * resolved gaze transfers its channels into the authored eye joints.
   */
  export function resolveLookAt(
    sample: IAutoMovieMotionSample,
    lookAt: IAutoMovieLookAt | undefined,
  ): IAutoMovieMotionSample {
    return resolveLookAtImplementation(sample, lookAt);
  }
}
