import type { IAutoMovieAnalysisDomainRollup } from "./IAutoMovieAnalysisDomainRollup";
import type { IAutoMovieAnalysisGap } from "./IAutoMovieAnalysisGap";

/**
 * A bounded verdict over every analysis run of one design revision.
 *
 * The report has one row per domain and at most the caller-selected positive
 * gap bound, defaulting to the engine's `AutoMovieEngineAnalysisReportMaxGaps` of
 * 16. Fixed bounds limit retained rows independently of run count; retained
 * revision, gap reasons and remedies still determine byte size.
 * {@link omittedGaps} counts every gap beyond the bound.
 *
 * A required unanswered domain, superseded revision or unavailable metric
 * prevents `meets`. A current measured miss takes precedence over those gaps;
 * otherwise they produce `incomplete`. The summarizer refuses a report
 * requiring no domain.
 */
export interface IAutoMovieAnalysisReport {
  /** Schema version. */
  version: 1;

  /** Versioned report protocol. */
  protocol: "automovie.analysis-report.v1";

  /**
   * Worst outcome: `misses` when any metric of a current-revision run violates
   * its declared target, otherwise `incomplete` when anything is missing or
   * stale, otherwise `meets`.
   *
   * Meets means every submitted run solved against this revision, every
   * required domain has a run, every metric produced a value and every compared
   * target was satisfied. Unknown-key or wrong-unit targets produce warnings
   * outside this rollup and can therefore coexist with meets; it does not
   * certify every originally requested target.
   */
  status: "meets" | "misses" | "incomplete";

  /** Non-blank design revision this report is a verdict about. */
  revision: string;

  /** One row per domain, in the engine's fixed domain order. */
  domains: IAutoMovieAnalysisDomainRollup[];

  /**
   * Missing answers in run order (metric order within a run), followed by
   * unanswered required domains in domain order, cut at the bound.
   */
  gaps: IAutoMovieAnalysisGap[];

  /** Gaps the bound left out; zero when every gap is listed. */
  omittedGaps: number;

  /**
   * Digest over protocol, version, status, revision, every rollup field, the
   * listed gaps and {@link omittedGaps}; gaps past the bound are not covered.
   */
  digest: string;
}
