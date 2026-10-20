import type { IAutoMovieRecoveryEventCurveArc } from "../curve/IAutoMovieRecoveryEventCurveArc";

/**
 * Four oriented cubic boundary paths and optional periodic seam identification.
 *
 * @evidence contracts/common.md#principled-implementation The ordered bottom, top, left and right paths retain exact corner authority and original curve phase charts.
 * @evidence contracts/common.md#clear-and-simple-design Each boundary is named by its local chart side rather than hidden in an anonymous object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Periodic seam identity does not imply material correspondence or an outward normal field.
 * @evidence contracts/common.md#meaningful-documentation Members document physical units, ownership and optional-state meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the declared records and arrays.
 */
export interface IAutoMovieRecoveryEventChart {
  /** Boundary at v=0, traversed from u=0 to u=1. */
  bottom: IAutoMovieRecoveryEventCurveArc;

  /** Boundary at v=1, traversed from u=0 to u=1. */
  top: IAutoMovieRecoveryEventCurveArc;

  /** Boundary at u=0, traversed from v=0 to v=1. */
  left: IAutoMovieRecoveryEventCurveArc;

  /** Boundary at u=1, traversed from v=0 to v=1. */
  right: IAutoMovieRecoveryEventCurveArc;

  /** True identifies left and right as the two periodic seam occurrences. */
  periodic?: boolean;
}
