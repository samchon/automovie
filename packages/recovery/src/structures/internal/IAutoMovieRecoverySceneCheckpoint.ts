import type { IAutoMovieRecoveryMapJointFit } from "../image/IAutoMovieRecoveryMapJointFit";
import type { IAutoMovieRecoveryMapPose } from "../image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoverySceneLandmark } from "../image/IAutoMovieRecoverySceneLandmark";

/**
 * Complete detached scene transaction outcome, not an automatic publication.
 *
 * @evidence contracts/common.md#principled-implementation Joint/final qualification controls whether proposed poses and points can transfer; failed geometry arrays are empty while completed diagnostics retain their own population.
 * @evidence contracts/common.md#clear-and-simple-design One internal result lets the coordinator atomically commit or preserve its old checkpoint.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A nonconverged or partly qualified proposal cannot expose accepted geometry.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish accepted arrays, failed reasons, proposed counts and final-only metrics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no refinement.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The coordinator consumes the already completed numerical proposal without refitting.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-owned bounded geometry transfers only on acceptance; no RGB or external handle is retained.
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
