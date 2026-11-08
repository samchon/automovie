import type { IAutoMovieRecoveryMapLandmark } from "../image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../image/IAutoMovieRecoveryMapPose";

/**
 * Detached fixed-population state owned by one joint map fit.
 *
 * @evidence contracts/development/design.md#principled-representation The ordered poses and landmark observations use the same seed gauge and feature identities throughout the fit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One internal numerical state passes between retraction, complete evaluation and local linearization.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No observation removal, pose injection or independent translation normalization is represented.
 * @evidence contracts/development/common.md#meaningful-documentation Fields state ordering and immutable population ownership.
 */
export interface IAutoMovieRecoveryMapState {
  /** Registered cameras in compact source order, first identity and seed norm one. */
  poses: IAutoMovieRecoveryMapPose[];

  /** Ordered points with every retained measurement in that same compact view chart. */
  landmarks: IAutoMovieRecoveryMapLandmark[];
}
