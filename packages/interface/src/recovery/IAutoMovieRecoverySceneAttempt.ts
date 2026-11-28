import type {
  IAutoMovieRecoveryMapJointFit,
  IAutoMovieRecoveryMapResection,
} from "..";

/**
 * Ledger entry for one charged registration transaction against an accepted
 * scene revision. The entry retains the stage diagnostics and proposed
 * populations after success or refusal.
 */
export interface IAutoMovieRecoverySceneAttempt {
  /** Original source index of the camera this transaction tries to register. */
  viewIndex: number;

  /** Accepted component revision at the start of the attempt. */
  revision: number;

  /** Existing landmark and target-feature pairs offered to resection. */
  candidates: number;

  /**
   * Final transaction disposition. Acceptance includes resection, detached
   * growth, joint convergence and every final qualification.
   */
  outcome:
    | "accepted"
    | "resection-refused"
    | "joint-refused"
    | "budget-exhausted";

  /** Available stage-specific reasons retained for the attempt. */
  reasons: string[];

  /** Completed resection report, or null if that stage did not return. */
  resection: IAutoMovieRecoveryMapResection | null;

  /**
   * Last completed joint fit report, or null before any completion. Its own
   * population can precede the last proposed counts.
   */
  joint: IAutoMovieRecoveryMapJointFit | null;

  /**
   * Point count of the most recent detached proposal announced for fitting, or
   * null before a proposal is reported.
   */
  proposedLandmarks: number | null;

  /**
   * Measurement count of the most recent detached proposal announced for
   * fitting, or null before a proposal is reported.
   */
  proposedObservations: number | null;
}
