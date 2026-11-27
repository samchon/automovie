import type {
  IAutoMovieRecoveryMapJointFit,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoverySceneLandmark,
} from "..";

/** Complete detached scene transaction outcome, not an automatic publication. */
export interface IAutoMovieRecoverySceneCheckpoint {
  /** All transaction qualification gates passed. */
  accepted: boolean;

  /** Complete available failed qualifications. */
  reasons: string[];

  /** Accepted source-order poses with unregistered nulls, or empty on failure. */
  poses: (IAutoMovieRecoveryMapPose | null)[];

  /** Accepted points/measurements and actual support, or empty on failure. */
  landmarks: IAutoMovieRecoverySceneLandmark[];

  /** Last completed fit, null before one completes. */
  joint: IAutoMovieRecoveryMapJointFit | null;

  /** Total points in the last evaluated proposal. */
  proposedLandmarks: number;

  /** Total retained observations in that proposal. */
  proposedObservations: number;

  /** Largest final pixel distance, null on failure. */
  maximumReprojectionErrorPx: number | null;

  /** Minimum pointwise strongest acute support angle, null on failure. */
  minimumPointParallaxDegrees: number | null;
}
