import type {
  AutoMovieRecoverySqpCorrection,
  IAutoMovieRecoverySqpReport,
} from "..";

/** Owned optional SQP mixture and one same-base curvature action. */
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

  /**
   * One current-base correction action, or null when unsupported; a second call
   * is invalid.
   */
  correct: AutoMovieRecoverySqpCorrection | null;
}
