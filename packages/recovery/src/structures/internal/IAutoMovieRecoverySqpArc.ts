import type { AutoMovieRecoverySqpCorrection } from "./AutoMovieRecoverySqpCorrection";
import type { IAutoMovieRecoverySqpReport } from "./IAutoMovieRecoverySqpReport";

/**
 * Owned optional SQP mixture and one same-base curvature action.
 *
 * @evidence contracts/common.md#principled-implementation A complete affine-QP certificate precedes mixing. The retained thin original-design factor supports one correction using actual failed-trial constraints.
 * @evidence contracts/common.md#clear-and-simple-design The controller owns actual trials and normal termination; this result owns only the current direction and working factor lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The mixture is not the baseline pure-QP optimum, and a correction is not an accepted nonlinear checkpoint.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish physical increments, selected ordered rows, independent QP multipliers and optional curvature support.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record delegates one already admitted action.
 * @evidence contracts/performance.md#reuse-equivalent-work One thin factor is shared by the SQP estimate and at most one curvature action.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Current owned vectors and factor closures expire with the model; only the scalar report may outlive it.
 */
export interface IAutoMovieRecoverySqpArc {
  /** Physical mixed direction, or null when the original direction is retained. */
  step: number[] | null;

  /** Full physical untilted QP step, for direct numerical verification only. */
  sqpStep: number[] | null;

  /** Original untilted QP multipliers in selected-row order. */
  multipliers: number[];

  /** Original ordered constraint rows, excluding objective row zero. */
  selected: number[];

  /** Latest scalar certificate and conservative work. */
  report: IAutoMovieRecoverySqpReport;

  /** One current-base correction action, or null when unsupported; a second call is invalid. */
  correct: AutoMovieRecoverySqpCorrection | null;
}
