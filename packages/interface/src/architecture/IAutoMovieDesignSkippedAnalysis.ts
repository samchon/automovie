/** One reading that produced nothing, reported rather than omitted. */
export interface IAutoMovieDesignSkippedAnalysis {
  /** Analysis that produced no reading. */
  analysis: string;

  /** Which kind of nothing it produced. */
  status: "unsupported" | "not-run";

  /** The analysis' own reason, carried through verbatim. */
  reason: string;
}
