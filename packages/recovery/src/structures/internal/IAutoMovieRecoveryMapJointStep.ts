import type { IAutoMovieRecoveryMapMetric } from "./IAutoMovieRecoveryMapMetric";

/**
 * Physical block step and independent original-design qualification.
 *
 * @evidence contracts/common.md#principled-implementation Original point/reduced-camera ranks qualify the consistently scaled least-squares step before optional damping supplies its metric.
 * @evidence contracts/common.md#clear-and-simple-design One named output serves ordinary refinement and optional feasible metric consumption.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A damped factor or returned step supplies no replacement for original data rank or nonlinear qualification.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish physical increments, undamped ratios and explicit factor retention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned steps and optional current factors transfer to caller; ordinary results contain no factor closure.
 */
export interface IAutoMovieRecoveryMapJointStep {
  /** C physical gauge-fixed camera increments. */
  cameraStep: number[];

  /** Three physical world-coordinate increments per ordered landmark. */
  pointSteps: [number, number, number][];

  /** Undamped column-scaled reduced-camera smallest/largest singular ratio. */
  cameraDesignRatio: number;

  /** Minimum corresponding undamped three-column landmark ratio. */
  minimumPointDesignRatio: number;

  /** Maximum scaled original least-squares gradient component. */
  gradient: number;

  /** Present only when explicitly retained for the feasible consumer. */
  metric?: IAutoMovieRecoveryMapMetric;
}
