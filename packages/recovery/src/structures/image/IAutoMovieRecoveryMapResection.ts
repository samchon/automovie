/**
 * Completed robust third-camera registration evidence without a refused pose.
 *
 * @evidence contracts/common.md#principled-implementation Independent support, stable final refits, conditional sampling and local numerical convergence remain separate recorded qualifications.
 * @evidence contracts/common.md#clear-and-simple-design One named report transfers resection diagnostics without leaking an unaccepted intermediate camera.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An achieved trial target is not material truth or covariance; absent work retains null diagnostics.
 * @evidence contracts/common.md#meaningful-documentation Members define candidate/inlier populations and distinguish actual work from requirements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The report performs no estimation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record defines no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Plain caller-owned values retain no external resource.
 */
export interface IAutoMovieRecoveryMapResection {
  /** Existing distinct landmarks having one third-view observation, before resection. */
  candidates: number;

  /** Positive-depth, in-threshold final 3D-to-2D pairs. */
  inliers: number;

  /** Actual unique-six proposals, including failed initializers. */
  trials: number;

  /** Recomputed final ideal all-inlier trial target, null when impossible or unrepresentable. */
  requiredTrials: number | null;

  /** Eligible proposals locally refined in draw order. */
  localRefinements: number;

  /** Declared failed numerical initializers/refinements, not unexpected program errors. */
  numericalRefusals: number;

  /** Number of attempted final fixed-support refits. */
  finalRefits: number;

  /** Final all-population reclassification retained identical inlier identities. */
  stable: boolean;

  /** Final fixed-support local fit converged; null when no such fit was attempted. */
  converged: boolean | null;

  /** Complete observed resection qualification failures. */
  refusalReasons: string[];
}
