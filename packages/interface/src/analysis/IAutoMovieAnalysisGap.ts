import { AutoMovieAnalysisDomain } from "./AutoMovieAnalysisDomain";

/**
 * One place a required answer is missing, at whatever granularity it is missing
 * at.
 *
 * A whole run may be unsupported, one metric inside a solved run may be, or a
 * required domain may have no run at all. All three are the same fact to a
 * reader deciding whether the design has been checked, so they are one row
 * shape rather than three lists nobody cross-reads.
 */
export interface IAutoMovieAnalysisGap {
  /** Run this gap came from, or null when no run answered for the domain. */
  run: string | null;

  /** Domain the missing answer belongs to. */
  domain: AutoMovieAnalysisDomain;

  /** Metric key, or null when the whole run produced nothing. */
  metric: string | null;

  /** Which kind of nothing this is. */
  status: "unsupported" | "not-run";

  /** Non-blank statement of what is missing. */
  reason: string;

  /** Non-blank statement of the exact change that would fill it. */
  remedy: string;
}
