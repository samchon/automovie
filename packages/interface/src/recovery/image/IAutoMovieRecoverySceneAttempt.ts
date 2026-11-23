import type {
  IAutoMovieRecoveryMapJointFit,
  IAutoMovieRecoveryMapResection,
} from "../../index";

/** One candidate transaction against an immutable accepted component revision. */
export interface IAutoMovieRecoverySceneAttempt {
  /** Source-order image being registered. */
  viewIndex: number;

  /** Accepted component revision used before this transaction. */
  revision: number;

  /** Distinct existing 3D-track/target-feature correspondences. */
  candidates: number;

  /**
   * Acceptance requires resection, growth, joint convergence and every final
   * gate.
   */
  outcome:
    | "accepted"
    | "resection-refused"
    | "joint-refused"
    | "budget-exhausted";

  /** Stage-specific complete reasons; no reason implies success by itself. */
  reasons: string[];

  /** Completed resection diagnostics; null if the stage did not finish. */
  resection: IAutoMovieRecoveryMapResection | null;

  /**
   * Last completed joint pass, possibly before a later growth pass failed; its
   * own population remains authoritative. Null if no pass completed.
   */
  joint: IAutoMovieRecoveryMapJointFit | null;

  /**
   * Proposed point population after new registered-view triangulation; null
   * before growth.
   */
  proposedLandmarks: number | null;

  /** Proposed retained observations; null before growth. */
  proposedObservations: number | null;
}
