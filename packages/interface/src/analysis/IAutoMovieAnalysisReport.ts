import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
import { IAutoMovieAnalysisDomainRollup } from "./IAutoMovieAnalysisDomainRollup";
import { IAutoMovieAnalysisGap } from "./IAutoMovieAnalysisGap";

/**
 * A bounded verdict over every analysis run of one design revision.
 *
 * The report has one row per domain and at most the summarizer's gap bound of
 * listed gaps (the engine's `AUTOMOVIE_ANALYSIS_REPORT_MAX_GAPS`, 16, unless
 * the caller passes another positive bound), so its size does not grow with the
 * number of runs. Gaps past the bound are counted in {@link omittedGaps}, which
 * is always stated.
 *
 * Silence never clears {@link status}. A required domain nobody answered, a run
 * that read a superseded revision, and a metric no adapter could produce all
 * land in {@link gaps} and force `incomplete`, and the summarizer refuses to
 * build a report that requires no domain.
 *
 * @evidence contracts/common.md#principled-implementation `summarizeAutoMovieAnalysis` validates every run, folds them into the six fixed domain rows, and sets status by precedence: a missed metric of a current solved run gives `misses`, else any gap gives `incomplete`, else `meets`; the digest is SHA-256 over newline-joined lines, each one JSON array of the listed fields, so no separator inside a field can collide with a field boundary.
 * @evidence contracts/common.md#clear-and-simple-design Fixed rollup rows plus a bounded gap list and an omitted count keep the artifact readable at a glance, and the digest field seals it without a separate signature record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refused runs, stale runs, value-less metrics and unanswered required domains all become gaps, a miss outranks gaps by design, and truncation is never silent because the omitted count is digested; omitted gap text is not covered, which the digest member states.
 * @evidence contracts/common.md#meaningful-documentation States the status precedence and exact meaning of `meets`, the gap bound and its default, gap ordering, the omitted count, the non-blank revision, and which fields the digest covers.
 * @author Samchon
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
   * `meets` means exactly "every submitted run solved against this revision,
   * every required domain has a run, every metric produced a value, and every
   * declared target was satisfied". It never means "nothing objected".
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
  digest: AutoMovieContentDigest;
}
