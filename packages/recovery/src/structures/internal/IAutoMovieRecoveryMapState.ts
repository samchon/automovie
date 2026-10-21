import type { IAutoMovieRecoveryMapLandmark } from "../image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../image/IAutoMovieRecoveryMapPose";

/**
 * Detached fixed-population state owned by one joint map fit.
 *
 * @evidence contracts/common.md#principled-implementation The ordered poses and landmark observations use the same seed gauge and feature identities throughout the fit.
 * @evidence contracts/common.md#clear-and-simple-design One internal numerical state passes between retraction, complete evaluation and local linearization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No observation removal, pose injection or independent translation normalization is represented.
 * @evidence contracts/common.md#meaningful-documentation Fields state ordering and immutable population ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no fit.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One fit owns O(N+L+E) scalars and arrays; detached rejected states expire without external resources.
 */
export interface IAutoMovieRecoveryMapState {
  /** Registered cameras in compact source order, first identity and seed norm one. */
  poses: IAutoMovieRecoveryMapPose[];

  /** Ordered points with every retained measurement in that same compact view chart. */
  landmarks: IAutoMovieRecoveryMapLandmark[];
}
