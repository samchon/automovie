import type { IAutoMovieRecoveryEventCurveSource } from "./IAutoMovieRecoveryEventCurveSource";

/**
 * One restricted cubic with a positive width in its enclosing chart.
 *
 * @evidence contracts/common.md#principled-implementation The native curve and oriented interval determine the occurrence without a duplicate coefficient net.
 * @evidence contracts/common.md#clear-and-simple-design The positive width defines phase independently of spatial length.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Width is neither a fitted tangent speed nor material transport evidence.
 * @evidence contracts/common.md#meaningful-documentation The native curve retains millimetre coefficients and original phase width; width uses the enclosing chart unit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type coordinates no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ownership belongs to its caller.
 */
export interface IAutoMovieRecoveryEventCurvePiece {
  /** Positive phase interval width. */
  width: number;

  /** Original native coefficient authority. */
  source: IAutoMovieRecoveryEventCurveSource;
}
