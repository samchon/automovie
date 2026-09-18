import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
import { IAutoMovieAnalysisDomainRollup } from "./IAutoMovieAnalysisDomainRollup";
import { IAutoMovieAnalysisGap } from "./IAutoMovieAnalysisGap";

/**
 * A bounded verdict over every analysis run of one design revision.
 *
 * The report is O(1) in the size of the production: one row per domain and at
 * most {@link AUTOMOVIE_ANALYSIS_REPORT_MAX_GAPS} gaps, with the remainder
 * counted rather than dropped. Bounding it without saying so would be a lie, so
 * {@link omittedGaps} is always stated.
 *
 * {@link status} can never be cleared by silence. A required domain nobody
 * answered, a run that read a superseded revision, and a metric no adapter
 * could produce all land in {@link gaps} and force `incomplete`, and a report
 * must declare at least one required domain to exist at all.
 *
 * @evidence requirements/acceptance/profiles-and-aggregation.md#acceptance-required-severity Exposes `IAutoMovieAnalysisReport` as the portable data boundary for the acceptance required severity requirement.
 * @evidence specifications/review-and-acceptance/profiles-aggregation-and-partial-results.md#acceptance-system-required-severity Types `IAutoMovieAnalysisReport` for the acceptance system required severity system contract.
 * @author Samchon
 */
export interface IAutoMovieAnalysisReport {
  /**
   * Schema version.
   *
   * @evidence requirements/acceptance/profiles-and-aggregation.md#acceptance-required-severity Exposes `version` as the portable data boundary for the acceptance required severity requirement.
   * @evidence specifications/review-and-acceptance/profiles-aggregation-and-partial-results.md#acceptance-system-required-severity Types `version` for the acceptance system required severity system contract.
   */
  version: 1;

  /**
   * Versioned report protocol.
   *
   * @evidence requirements/acceptance/profiles-and-aggregation.md#acceptance-required-severity Exposes `protocol` as the portable data boundary for the acceptance required severity requirement.
   * @evidence specifications/review-and-acceptance/profiles-aggregation-and-partial-results.md#acceptance-system-required-severity Types `protocol` for the acceptance system required severity system contract.
   */
  protocol: "automovie.analysis-report.v1";

  /**
   * Worst outcome: `misses` when any measured metric violates its declared
   * target, otherwise `incomplete` when anything is missing or stale, otherwise
   * `meets`.
   *
   * `meets` means exactly "every required domain answered against this
   * revision, every metric produced a value, and every declared target was
   * satisfied". It never means "nothing objected".
   *
   * @evidence requirements/acceptance/profiles-and-aggregation.md#acceptance-required-severity Exposes `status` as the portable data boundary for the acceptance required severity requirement.
   * @evidence specifications/review-and-acceptance/profiles-aggregation-and-partial-results.md#acceptance-system-required-severity Types `status` for the acceptance system required severity system contract.
   */
  status: "meets" | "misses" | "incomplete";

  /**
   * Design revision this report is a verdict about.
   *
   * @evidence requirements/acceptance/profiles-and-aggregation.md#acceptance-required-severity Exposes `revision` as the portable data boundary for the acceptance required severity requirement.
   * @evidence specifications/review-and-acceptance/profiles-aggregation-and-partial-results.md#acceptance-system-required-severity Types `revision` for the acceptance system required severity system contract.
   */
  revision: string;

  /**
   * One row per domain, in the fixed domain order.
   *
   * @evidence requirements/acceptance/profiles-and-aggregation.md#acceptance-required-severity Exposes `domains` as the portable data boundary for the acceptance required severity requirement.
   * @evidence specifications/review-and-acceptance/profiles-aggregation-and-partial-results.md#acceptance-system-required-severity Types `domains` for the acceptance system required severity system contract.
   */
  domains: IAutoMovieAnalysisDomainRollup[];

  /**
   * Missing answers, bounded and in run order.
   *
   * @evidence requirements/acceptance/profiles-and-aggregation.md#acceptance-required-severity Exposes `gaps` as the portable data boundary for the acceptance required severity requirement.
   * @evidence specifications/review-and-acceptance/profiles-aggregation-and-partial-results.md#acceptance-system-required-severity Types `gaps` for the acceptance system required severity system contract.
   */
  gaps: IAutoMovieAnalysisGap[];

  /**
   * Gaps the bound left out.
   *
   * @evidence requirements/acceptance/profiles-and-aggregation.md#acceptance-required-severity Exposes `omittedGaps` as the portable data boundary for the acceptance required severity requirement.
   * @evidence specifications/review-and-acceptance/profiles-aggregation-and-partial-results.md#acceptance-system-required-severity Types `omittedGaps` for the acceptance system required severity system contract.
   */
  omittedGaps: number;

  /**
   * Digest over protocol, status, revision, rollups and listed gaps.
   *
   * @evidence requirements/acceptance/profiles-and-aggregation.md#acceptance-required-severity Exposes `digest` as the portable data boundary for the acceptance required severity requirement.
   * @evidence specifications/review-and-acceptance/profiles-aggregation-and-partial-results.md#acceptance-system-required-severity Types `digest` for the acceptance system required severity system contract.
   */
  digest: AutoMovieContentDigest;
}
