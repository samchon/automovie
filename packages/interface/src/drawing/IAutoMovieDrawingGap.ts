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
