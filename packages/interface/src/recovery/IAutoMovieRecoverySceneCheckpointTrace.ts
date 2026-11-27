import type {
  IAutoMovieRecoveryMapJointFit,
  IAutoMovieRecoveryMapLandmark,
  IAutoMovieRecoveryMapPose,
} from "..";

/**
 * Owned diagnostic snapshot on either side of one detached joint fit. These
 * states include every proposed observation, including points later refused by
 * final qualification. They are not accepted scene checkpoints.
 */
export interface IAutoMovieRecoverySceneCheckpointTrace {
  /** Boundary of the actual numerical joint call, before final qualification. */
  phase: "before-joint" | "after-joint";

  /** Zero-based closure fit; a later pass requires actual population growth. */
  pass: number;

  /** Input-source index for each compact pose and observation view index. */
  activeViews: number[];

  /** Compact active world-to-camera poses in the original seed gauge. */
  poses: IAutoMovieRecoveryMapPose[];

  /**
   * Complete proposed points and compact-indexed observations, without
   * filtering.
   */
  landmarks: IAutoMovieRecoveryMapLandmark[];

  /** Actual completed fit report after fitting, otherwise null. */
  joint: IAutoMovieRecoveryMapJointFit | null;
}
