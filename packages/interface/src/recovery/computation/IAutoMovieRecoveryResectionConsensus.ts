import type {
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoveryResectionRefinementOperation,
} from "../../index";

/** Qualified robust resection or explicit support and convergence refusal. */
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
  refinement: ReturnType<IAutoMovieRecoveryResectionRefinementOperation.Operation> | null;
}
