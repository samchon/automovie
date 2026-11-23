import type { AutoMovieDrawingGapStatus } from "./AutoMovieDrawingGapStatus";

/**
 * One derivation that produced nothing, and the exact reason.
 *
 * A drawing that omitted what it could not compute would read as a drawing of a
 * building with no such thing in it, so the absence is named instead. The
 * record mirrors the render report's analysis gap, with a kebab-case subject in
 * place of a typed metric.
 *
 * The drawing, the schedule and the quantity report all emit this record and
 * sort their gaps by `subject`, with each subject at most once per report. Some
 * `unsupported` subjects, such as `hidden-line-removal`, appear in every
 * drawing because no design can supply the missing derivation.
 */
export interface IAutoMovieDrawingGap {
  /**
   * What was not derived, as a stable kebab-case subject such as
   * `opening-geometry`.
   */
  subject: string;

  /** Whether the derivation does not exist or merely had no input. */
  status: AutoMovieDrawingGapStatus;

  /**
   * Exactly what is absent, with the number of affected records when the
   * absence is per record.
   */
  reason: string;

  /** Exactly what would make the derivation produce a result. */
  remedy: string;
}
