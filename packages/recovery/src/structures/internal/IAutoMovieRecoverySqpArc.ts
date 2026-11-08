import type { AutoMovieRecoverySqpCorrection } from "./AutoMovieRecoverySqpCorrection";
import type { IAutoMovieRecoverySqpReport } from "./IAutoMovieRecoverySqpReport";

/**
 * Owned optional SQP mixture and one same-base curvature action.
 *
 * @evidence contracts/development/design.md#principled-representation A complete affine-QP certificate precedes mixing. The retained thin original-design factor supports one correction using actual failed-trial constraints.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The controller owns actual trials and normal termination; this result owns only the current direction and working factor lifetime.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The mixture is not the baseline pure-QP optimum, and a correction is not an accepted nonlinear checkpoint.
 * @evidence contracts/development/common.md#meaningful-documentation Fields distinguish physical increments, selected ordered rows, independent QP multipliers and optional curvature support.
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
