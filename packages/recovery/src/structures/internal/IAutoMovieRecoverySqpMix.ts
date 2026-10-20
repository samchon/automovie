/**
 * One nominal or numerically supported physical mixture, without a QP claim.
 *
 * @evidence contracts/common.md#principled-implementation A bounded affine segment search only changes the coefficient of two existing physical directions. Every returned vector passes the original raw row signs.
 * @evidence contracts/common.md#clear-and-simple-design The result distinguishes nominal mixing from one operation-scaled support attempt; nonlinear trials stay with the controller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No row residual is clamped, discarded or accepted using a rounding allowance.
 * @evidence contracts/common.md#meaningful-documentation Members state physical ownership, coefficient and numerical-support status without claiming a pure-QP optimum or convergence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased output performs no work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One owned physical vector transfers, or null; no search history transfers.
 */
export interface IAutoMovieRecoverySqpMix {
  /** Owned physical direction, null if neither bounded candidate was supported. */
  step: number[] | null;

  /** Last candidate's coefficient of the original tilted direction. */
  weight: number;

  /** Whether the nominal candidate needed a segment-support calculation. */
  numericalAttempted: boolean;

  /** Whether that single supported candidate passed the original raw signs. */
  numericalSupported: boolean;
}
