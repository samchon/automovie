/**
 * One reading that produced nothing, reported rather than omitted.
 *
 * `promoteDesignObservations` emits one per analysis whose outcome is
 * `unsupported` or `not-run`, in the document's analysis order.
 */
export interface IAutoMovieDesignSkippedAnalysis {
  /** Analysis that produced no reading. */
  analysis: string;

  /** Which kind of nothing it produced. */
  status: "unsupported" | "not-run";

  /** The analysis' own non-blank reason, carried through verbatim. */
  reason: string;
}
