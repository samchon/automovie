import type {
  IAutoMovieRecoveryMapJointFit,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoverySceneLandmark,
} from "..";

/**
 * Detached outcome of completing one scene checkpoint. The caller can commit
 * the geometry only when `accepted` is true.
 */
export interface IAutoMovieRecoverySceneCheckpoint {
  /**
   * True when convergence, gauge, final retained-point qualification and
   * population closure all pass.
   */
  accepted: boolean;

  /** Available qualification failures from the last evaluated proposal. */
  reasons: string[];

  /**
   * Accepted poses in original source order with nulls for unregistered views,
   * or an empty array on refusal.
   */
  poses: (IAutoMovieRecoveryMapPose | null)[];

  /**
   * Accepted points with their retained measurements and actual supporting
   * pairs, or an empty array on refusal.
   */
  landmarks: IAutoMovieRecoverySceneLandmark[];

  /** Last completed joint fit report, or null before a report exists. */
  joint: IAutoMovieRecoveryMapJointFit | null;

  /** Number of points in the last evaluated fitting population. */
  proposedLandmarks: number;

  /** Number of image measurements in the last evaluated fitting population. */
  proposedObservations: number;

  /**
   * Largest retained Euclidean pixel residual on acceptance, or null on
   * refusal.
   */
  maximumReprojectionErrorPx: number | null;

  /**
   * Minimum across retained points of their strongest actual acute ray angle in
   * degrees, or null on refusal.
   */
  minimumPointParallaxDegrees: number | null;
}
