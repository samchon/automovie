/** Completed robust third-camera registration evidence without a refused pose. */
export interface IAutoMovieRecoveryMapResection {
  /**
   * Existing distinct landmarks having one third-view observation, before
   * resection.
   */
  candidates: number;

  /** Positive-depth, in-threshold final 3D-to-2D pairs. */
  inliers: number;

  /** Actual unique-six proposals, including failed initializers. */
  trials: number;

  /**
   * Recomputed final ideal all-inlier trial target, null when impossible or
   * unrepresentable.
   */
  requiredTrials: number | null;

  /** Eligible proposals locally refined in draw order. */
  localRefinements: number;

  /**
   * Declared failed numerical initializers/refinements, not unexpected program
   * errors.
   */
  numericalRefusals: number;

  /** Number of attempted final fixed-support refits. */
  finalRefits: number;

  /** Final all-population reclassification retained identical inlier identities. */
  stable: boolean;

  /**
   * Final fixed-support local fit converged; null when no such fit was
   * attempted.
   */
  converged: boolean | null;

  /** Complete observed resection qualification failures. */
  refusalReasons: string[];
}
