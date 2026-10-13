import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
import { IAutoMovieAnalysisDomainRollup } from "./IAutoMovieAnalysisDomainRollup";
import { IAutoMovieAnalysisGap } from "./IAutoMovieAnalysisGap";

/**
 * A bounded verdict over every analysis run of one design revision.
 *
 * The report is O(1) in the size of the production: one row per domain and at
 * most the summarizer's gap bound of listed gaps (the engine's
 * `AUTOMOVIE_ANALYSIS_REPORT_MAX_GAPS`, 16, unless the caller passes another
 * positive bound), with the remainder counted rather than dropped. Bounding it
 * without saying so would be a lie, so {@link omittedGaps} is always stated.
 *
 * {@link status} can never be cleared by silence. A required domain nobody
 * answered, a run that read a superseded revision, and a metric no adapter
 * could produce all land in {@link gaps} and force `incomplete`, and a report
 * must declare at least one required domain to exist at all.
 *
 * @evidence contracts/common.md#principled-implementation `summarizeAutoMovieAnalysis` validates every run, folds them into the six fixed domain rows, and sets status by precedence: any measured miss gives `misses`, else any gap gives `incomplete`, else `meets`; the digest is SHA-256 over a newline-joined canonical text of the listed fields.
 * @evidence contracts/common.md#clear-and-simple-design A fixed rollup array plus a bounded gap list with an omitted count keeps the artifact size independent of run count, and the digest seals it without a separate signature record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The summarizer throws when no domain is required, and stale runs, refused runs, value-less metrics and unanswered required domains all become gaps; a miss outranks gaps on purpose, so an incomplete report containing a miss reads `misses`.
 * @evidence contracts/common.md#meaningful-documentation States the status precedence and the exact meaning of `meets`, the gap bound and its default, gap ordering, the omitted count, and which fields the digest covers.
 * @author Samchon
 */
export interface IAutoMovieAnalysisReport {
  /** Schema version. */
  version: 1;

  /** Versioned report protocol. */
  protocol: "automovie.analysis-report.v1";

  /**
   * Worst outcome: `misses` when any measured metric violates its declared
   * target, otherwise `incomplete` when anything is missing or stale, otherwise
   * `meets`.
   *
   * `meets` means exactly "every required domain answered against this
   * revision, every metric produced a value, and every declared target was
   * satisfied". It never means "nothing objected".
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

  /** Gaps the bound left out. */
  omittedGaps: number;

  /**
   * Digest over protocol, version, status, revision, every rollup field, the
   * listed gaps and {@link omittedGaps}; gaps past the bound are not covered.
   */
  digest: AutoMovieContentDigest;
}
