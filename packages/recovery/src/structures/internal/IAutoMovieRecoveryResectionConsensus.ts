import type { refineRecoveryResection } from "../../internal/refineRecoveryResection";
import type { IAutoMovieRecoveryMapPose } from "../image/IAutoMovieRecoveryMapPose";

/**
 * Qualified robust resection or explicit support and convergence refusal.
 *
 * @evidence contracts/common.md#principled-implementation A pose exists only after fixed-population pixel consensus, stable final membership, converged refinement and recomputed conditional trial requirements pass.
 * @evidence contracts/common.md#clear-and-simple-design The named result separates final qualification from optional transient diagnostic events.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refused intermediate poses do not become a registered camera; indices alone do not certify material identity.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish actual proposals, refinement attempts, fitted support and conditional confidence from geometric truth.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased result performs no fit.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The numerical owner supplies the final already computed report.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owned final coefficients and O(N) support transfer without retaining images, diagnostic history or resources.
 */
export interface IAutoMovieRecoveryResectionConsensus {
  /** Accepted world-to-camera pose, or null for any qualification failure. */
  pose: IAutoMovieRecoveryMapPose | null;

  /** Final ascending support indices in the original paired input arrays. */
  indices: number[];

  /** Six-point proposals actually started. */
  trials: number;

  /** Ideal finite-population trial target at final support, or null if infinite. */
  requiredTrials: number | null;

  /** Eligible proposal-local nonlinear fits actually entered. */
  localRefinements: number;

  /** Aggregate declared numerical errors, not a degeneracy classification. */
  numericalRefusals: number;

  /** Final fixed-support refits actually entered, at most three. */
  finalRefits: number;

  /** Whether the last converged final refit preserved exact support membership. */
  stable: boolean;

  /** All final qualification failures; empty only for an accepted pose. */
  refusalReasons: string[];

  /** Last completed final fit, including explicit nonconvergence, or null. */
  refinement: ReturnType<typeof refineRecoveryResection> | null;
}
