import { AutoMovieDrawingGapStatus } from "./AutoMovieDrawingGapStatus";

/**
 * One derivation that produced nothing, and the exact reason.
 *
 * The same shape the render report uses, for the same reason: a drawing that
 * omitted what it could not compute would read as a drawing of a building with
 * no such thing in it. Naming the absence is the only way a sheet can be
 * trusted for what it does show.
 *
 * The drawing, the schedule and the quantity report all emit this record and
 * sort their gaps by `subject`. Some `unsupported` subjects, such as
 * `hidden-line-removal`, appear in every drawing because no design can supply
 * the missing derivation.
 *
 * @evidence contracts/common.md#principled-implementation Mirrors the render report's metric gap with an open subject string, so every derivation that declines to compute something emits one sortable, hashed record instead of omitting it.
 * @evidence contracts/common.md#clear-and-simple-design Four fields, what, which kind of absence, why and how to fix it, shared by the drawing, schedule and quantity report instead of each declaring its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Data-dependent gaps are emitted only when the derivation actually lacked input, with the counts and ids interpolated into `reason`, while capability gaps are emitted unconditionally because their derivation does not exist.
 * @evidence contracts/common.md#meaningful-documentation States which artifacts emit the record, the gap ordering, the open subject vocabulary, the always-present capability gaps, and what `reason` and `remedy` must each name.
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

  /** Exactly what is absent, naming the declaration that needed it. */
  reason: string;

  /** Exactly what would make the derivation produce a result. */
  remedy: string;
}
