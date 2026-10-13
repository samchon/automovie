import {
  IAutoMovieConstraintViolation,
  IAutoMovieReviewNote,
} from "@automovie/interface";

/**
 * What `reviewShot` returns for one reviewer write: the verdict and correction
 * backlog the re-perform loop runs on, or every contradiction that makes the
 * write unusable.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on the literal `success`; `reviewShot` reaches the success variant only when the beat is non-blank and exists once in the script, a `revise` carries notes, a `pass` carries none, and every note is filed on the judged beat, so a caller acting on the verdict cannot spin on an empty revise or lose a misfiled note.
 * @evidence contracts/common.md#clear-and-simple-design Two variants with only what each outcome needs, the same success-or-violations shape the engine's other stage results use, so the loop branches once on `success`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A contradictory write is reported, never repaired: notes are not refiled, dropped or invented to make the verdict coherent.
 * @evidence contracts/common.md#meaningful-documentation States the producer and what each variant means for the review loop; the variants state their guarantees and field ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type with no runtime body; the checks are answered on `reviewShot`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One result per `reviewShot` call; no verdict is cached.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ownership is stated per variant: success shares the reviewer's notes array, failure owns a new violation list.
 * @author Samchon
 */
export type IAutoMovieShotReview =
  | IAutoMovieShotReview.ISuccess
  | IAutoMovieShotReview.IFailure;

export namespace IAutoMovieShotReview {
  /**
   * The review is coherent; act on its verdict.
   *
   * @evidence contracts/common.md#principled-implementation Returned only after every check of `reviewShot` passed, so `verdict` and `notes` agree: `pass` with an empty list, `revise` with at least one note, every note on `beat`.
   * @evidence contracts/common.md#clear-and-simple-design The judged beat, the verdict and the backlog, which is what the next blocking or performance round needs; the script is not echoed because the caller already holds it.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The verdict and notes are passed through verbatim rather than normalized, so the next round reads exactly what the reviewer wrote.
   * @evidence contracts/common.md#meaningful-documentation States what success guarantees and, per field, the beat's origin, the verdict values, the backlog's emptiness rule, its reader and that it is the reviewer's own array.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; the checks are answered on `reviewShot`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Produced per call and consumed by the same review round.
   * @evidence contracts/performance.md#bound-retention-and-release-resources `notes` is the reviewer write's own array by reference, not a copy, so it lives as long as either holder and mutating it after the check bypasses the gate.
   */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /** The judged beat id, non-blank and declared once in the script. */
    beat: string;

    /** The reviewer's verdict, verbatim. */
    verdict: "pass" | "revise";

    /**
     * The correction backlog: empty for a pass, non-empty for a revise, every
     * note filed on {@link beat}. The next blocking or performance round reads
     * it through `getNotes`. This is the reviewer write's own array.
     */
    notes: IAutoMovieReviewNote[];
  }

  /**
   * The review contradicted itself or the script.
   *
   * @evidence contracts/common.md#principled-implementation Collects every finding of the single `reviewShot` pass through one `ViolationCollector`: duplicated script beat ids, a blank or unknown review beat, a revise without notes, a pass with notes, and each blank or misfiled note beat, each with its JSON path and value.
   * @evidence contracts/common.md#clear-and-simple-design Only the list, because the correction round needs every contradiction at once and no partial verdict is safe to act on.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No contradiction is downgraded to a warning or auto-corrected, so a review is either fully coherent or rejected.
   * @evidence contracts/common.md#meaningful-documentation States that failure means a contradiction with the script or within the write, and that the list is complete for the correction round.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; collecting is linear in beats plus notes, answered on `reviewShot`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Produced per call; nothing reuses a rejected review.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns a new array of violation records, one per contradiction, released with the caller's result.
   */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every contradiction found, in check order, for the correction round. */
    violations: IAutoMovieConstraintViolation[];
  }
}
