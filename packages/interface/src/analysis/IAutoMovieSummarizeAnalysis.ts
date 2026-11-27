import type { AutoMovieAnalysisDomain } from "./AutoMovieAnalysisDomain";
import type { IAutoMovieAnalysisRun } from "./IAutoMovieAnalysisRun";

/** Data and callback contracts shared by the SummarizeAnalysis operations. */
export namespace IAutoMovieSummarizeAnalysis {
  /**
   * Roll every run of one design revision into one bounded verdict.
   *
   * The report cannot be cleared by silence. A required domain nobody submitted
   * a run for becomes a gap of its own; a run that read a superseded revision
   * is counted as stale rather than as an answer; a metric that produced no
   * value carries its reason up. Only when every required domain answered
   * against this revision, every metric produced a value, and every judged
   * metric met its target does the status read `meets`.
   *
   * Declaring at least one required domain is mandatory, which is what removes
   * the last way to pass: a report over nothing would otherwise clear
   * everything.
   *
   * Gaps come from every submitted run, whether or not its domain is required.
   * Any `misses` metric makes the status `misses`; otherwise any gap makes it
   * `incomplete`. Gaps are ordered by run and by metric within a run, then by
   * missing required domain in domain-table order; the first `maxGaps` of that
   * list are listed and the rest only counted. The digest is SHA-256 over one
   * JSON array per line (header, each rollup, each listed gap, then the omitted
   * count), so it covers the listed gaps and that count but not the text of the
   * omitted ones.
   *
   * Throws on a blank revision, a gap bound that is not a positive safe
   * integer, an empty or unknown required domain, a run that fails validation,
   * and a run id reported twice.
   */
  export type IProps = {
    /** Runs to roll up; each is validated before it is counted. */
    runs: readonly IAutoMovieAnalysisRun[];

    /** Non-blank design revision the report is a verdict about. */
    revision: string;

    /** Domains the production requires an answer for; at least one, all known. */
    required: readonly AutoMovieAnalysisDomain[];

    /**
     * Positive safe-integer bound on listed gaps; defaults to
     * `AutoMovieEngineAnalysisReportMaxGaps`.
     */
    maxGaps?: number;
  };
}
