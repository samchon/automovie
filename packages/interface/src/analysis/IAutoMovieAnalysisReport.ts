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
