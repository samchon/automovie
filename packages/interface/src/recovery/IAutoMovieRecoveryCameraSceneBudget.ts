import type { IAutoMovieRecoveryCameraMapBudget } from "./IAutoMovieRecoveryCameraMapBudget";

/**
 * Positive safe integer ceilings for repeated camera registration. The
 * inherited controls cover observations and individual fitting stages.
 * Scene-specific controls bound additional attempts, charged work, and
 * simultaneous numerical storage.
 */
export interface IAutoMovieRecoveryCameraSceneBudget extends IAutoMovieRecoveryCameraMapBudget {
  /**
   * Maximum supplied source count, with at least three allowed. Active camera
   * count determines the joint design width.
   */
  maxViews: number;

  /**
   * Total camera registration attempts charged before a transaction, including
   * refused attempts.
   */
  maxCameraAttempts: number;

  /** Total six-point resection proposals charged across candidate transactions. */
  maxTotalResectionTrials: number;

  /**
   * Total new-point designs charged during growth, including retries and
   * geometric refusals.
   */
  maxTriangulations: number;

  /**
   * Total detached joint fits charged, including the initial scene fit and
   * later rolled-back fits.
   */
  maxJointFits: number;

  /**
   * Total charged numerical work units across scene growth and refinement.
   * Charges derive from design dimensions and configured iteration or sweep
   * costs.
   */
  maxLinearWork: number;

  /**
   * Maximum incremental linear scalar slots simultaneously retained. This
   * estimate covers point and resection scratch, joint buffers and retained
   * reports when applicable.
   */
  maxResidentLinearEntries: number;
}
