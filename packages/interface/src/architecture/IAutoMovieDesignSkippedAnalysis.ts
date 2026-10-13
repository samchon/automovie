/**
 * One reading that produced nothing, reported rather than omitted.
 *
 * @evidence contracts/common.md#principled-implementation `promoteDesignObservations` copies one row from each analysis whose outcome is `unsupported` or `not-run`, carrying the reason verbatim so the promotion never writes an explanation of its own.
 * @evidence contracts/common.md#clear-and-simple-design Three fields mirroring the non-observed outcome variants plus the analysis id; it lists analyses rather than candidates because an empty attempt has no candidate to name.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The two status literals are the outcome contract's own discriminants, and every non-observed analysis is listed whatever its label.
 * @evidence contracts/common.md#meaningful-documentation States which analysis produced nothing, which kind of nothing, and that the reason is the analysis' own text.
 * @author Samchon
 */
export interface IAutoMovieDesignSkippedAnalysis {
  /** Analysis that produced no reading. */
  analysis: string;

  /** Which kind of nothing it produced. */
  status: "unsupported" | "not-run";

  /** The analysis' own reason, carried through verbatim. */
  reason: string;
}
