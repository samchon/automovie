/**
 * One reading that produced nothing, reported rather than omitted.
 *
 * `promoteDesignObservations` emits one per analysis whose outcome is
 * `unsupported` or `not-run`, in the document's analysis order.
 *
 * @evidence contracts/common.md#principled-implementation `promoteDesignObservations` copies the analysis id, its outcome status, and its outcome reason for every analysis whose status is not `observed`; `validateDesignReference` has already required that reason to be non-blank.
 * @evidence contracts/common.md#clear-and-simple-design Three fields restate the analysis outcome in the promotion result, so a caller reads every empty reading from one list without walking the reference again.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reason is carried verbatim rather than rewritten into a generic message, and an empty analysis is listed rather than filtered out of the result.
 * @evidence contracts/common.md#meaningful-documentation States which analyses produce an entry and in what order, the two statuses an entry can carry, and that the reason is the analysis' own text.
 * @author Samchon
 */
export interface IAutoMovieDesignSkippedAnalysis {
  /** Analysis that produced no reading. */
  analysis: string;

  /** Which kind of nothing it produced. */
  status: "unsupported" | "not-run";

  /** The analysis' own non-blank reason, carried through verbatim. */
  reason: string;
}
