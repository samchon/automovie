import { AutoMovieDrawingGapStatus } from "./AutoMovieDrawingGapStatus";

/**
 * One derivation that produced nothing, and the exact reason.
 *
 * A drawing that omitted what it could not compute would read as a drawing of
 * a building with no such thing in it, so the absence is named instead. The
 * record mirrors the render report's analysis gap, with a kebab-case subject in
 * place of a typed metric.
 *
 * The drawing, the schedule and the quantity report all emit this record and
 * sort their gaps by `subject`, with each subject at most once per report. Some
 * `unsupported` subjects, such as `hidden-line-removal`, appear in every
 * drawing because no design can supply the missing derivation.
 *
 * @evidence contracts/common.md#principled-implementation Each derivation pushes a gap at the point it skips work, counting the affected records into the reason when the absence is per record, and sorts the list with `compareAutoMovieRenderIds` so its order is independent of the design's declaration order.
 * @evidence contracts/common.md#clear-and-simple-design Subject, status, reason and remedy name omitted work, its producer-assigned category, explanation and suggested next action. One shape serves all three derivations; it does not independently validate the explanation or establish fault ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Subjects are an open string owned by the deriving engine functions rather than a closed union, so nothing checks their spelling; subjects shared by two derivations currently agree in spelling and status, which only review enforces.
 * @evidence contracts/common.md#meaningful-documentation States why gaps exist, which records emit them, their order and uniqueness, the always-present subjects, and what each member must say.
 * @author Samchon
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
