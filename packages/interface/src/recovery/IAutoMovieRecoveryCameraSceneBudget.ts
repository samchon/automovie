import type { IAutoMovieRecoveryCameraMapBudget } from "./IAutoMovieRecoveryCameraMapBudget";

/**
 * Additional positive safe-integer ceilings for incremental camera registration.
 * Inherited map limits bound one fit and aggregate observations; these limits
 * bound the number and combined work of repeated scene transactions.
 *
 * @evidence contracts/common.md#principled-implementation View count, camera attempts, original point designs, consensus proposals, joint fits and dimension-sweep work are separate admitted populations. Scalar-slot retention is distinguished from bytes, host RSS and actual arithmetic operations.
 * @evidence contracts/common.md#clear-and-simple-design Inheritance reuses unchanged geometric fit limits while these members own the extra repeated-scene work.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Work ceilings neither add observations nor prove convergence; no failed camera raises a declared limit.
 * @evidence contracts/common.md#meaningful-documentation Members define aggregate versus per-fit units and distinguish logical scalar retention from process-memory measurement.
 */
export interface IAutoMovieRecoveryCameraSceneBudget extends IAutoMovieRecoveryCameraMapBudget {
  /** Maximum supplied images, at least three; the actual active set fixes joint width 6N-7. */
  maxViews: number;

  /** Aggregate camera resection transactions, including refused attempts. */
  maxCameraAttempts: number;

  /** Aggregate six-point proposals across every attempted resection. */
  maxTotalResectionTrials: number;

  /** Aggregate original point designs, including refused/retried triangulations. */
  maxTriangulations: number;

  /** Aggregate joint fits, including those rolled back after failure. */
  maxJointFits: number;

  /** Aggregate charged dimension-sweep units for new-point and joint designs; not FLOPs or milliseconds. Seed/resection retain their separate per-fit and proposal ceilings. */
  maxLinearWork: number;

  /** Conservative simultaneous incremental point/resection/joint linear scalar slots, checked before factors or population growth; the seed fit retains seedBudget limits. Excludes image/descriptor storage and JS overhead, and is not a byte/RSS certificate. */
  maxResidentLinearEntries: number;
}
