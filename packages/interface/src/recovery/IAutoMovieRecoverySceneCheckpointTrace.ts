import type {
  IAutoMovieRecoveryMapJointFit,
  IAutoMovieRecoveryMapLandmark,
  IAutoMovieRecoveryMapPose,
} from "..";

/**
 * Owned snapshot delivered to an optional observer immediately before or after
 * a detached joint fit. A snapshot contains all proposed observations and may
 * precede a later refusal.
 */
export interface IAutoMovieRecoverySceneCheckpointTrace {
  /** Side of the joint call at which the snapshot was made. */
  phase: "before-joint" | "after-joint";

  /**
   * Zero-based closure pass. Later passes follow observed growth of the
   * retained population.
   */
  pass: number;

  /**
   * Original source index for each compact pose and compact observation view
   * index.
   */
  activeViews: number[];

  /**
   * Active world-to-camera poses in compact order, using the original seed
   * gauge.
   */
  poses: IAutoMovieRecoveryMapPose[];

  /**
   * Complete fitter point and measurement population with compact observation
   * view indices.
   */
  landmarks: IAutoMovieRecoveryMapLandmark[];

  /** Completed fit report for `after-joint`, or null for `before-joint`. */
  joint: IAutoMovieRecoveryMapJointFit | null;
}
