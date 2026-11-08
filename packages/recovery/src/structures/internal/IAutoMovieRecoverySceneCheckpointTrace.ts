import type { IAutoMovieRecoveryMapJointFit } from "../image/IAutoMovieRecoveryMapJointFit";
import type { IAutoMovieRecoveryMapLandmark } from "../image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../image/IAutoMovieRecoveryMapPose";

/**
 * Owned diagnostic snapshot on either side of one detached joint fit.
 * These states include every proposed observation, including points later
 * refused by final qualification. They are not accepted scene checkpoints.
 *
 * @evidence contracts/development/design.md#principled-representation Matching landmark and observation identities expose the fixed population before and after the actual joint fit; activeViews translates compact pose and observation indices back to input sources.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The optional internal observer receives numerical state without changing the public scene result or retaining rejected geometry in ordinary operations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Diagnostic state supplies no candidate selection, replacement geometry, success fallback or relaxed gate.
 * @evidence contracts/development/common.md#meaningful-documentation Defines closure-pass numbering, compact source indices, failed-state meaning, ownership and report availability.
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

  /** Complete proposed points and compact-indexed observations, without filtering. */
  landmarks: IAutoMovieRecoveryMapLandmark[];

  /** Actual completed fit report after fitting, otherwise null. */
  joint: IAutoMovieRecoveryMapJointFit | null;
}
