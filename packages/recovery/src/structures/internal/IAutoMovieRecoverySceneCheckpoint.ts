import type { IAutoMovieRecoveryMapJointFit } from "../image/IAutoMovieRecoveryMapJointFit";
import type { IAutoMovieRecoveryMapPose } from "../image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoverySceneLandmark } from "../image/IAutoMovieRecoverySceneLandmark";

/**
 * Complete detached scene transaction outcome, not an automatic publication.
 *
 * @evidence contracts/development/design.md#principled-representation Joint/final qualification controls whether proposed poses and points can transfer; failed geometry arrays are empty while completed diagnostics retain their own population.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One internal result lets the coordinator atomically commit or preserve its old checkpoint.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A nonconverged or partly qualified proposal cannot expose accepted geometry.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish accepted arrays, failed reasons, proposed counts and final-only metrics.
 */
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
